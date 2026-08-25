import os
import sys
import math
import logging
import re
from pathlib import Path

# Resolve project & backend root directories for app.schemas imports
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from typing import Dict, List, Optional, Tuple
from ai.matching.bge_embedder import BGEEmbeddingEngine
from ai.matching.bge_reranker import BGERerankerEngine
from app.schemas.search import ProductItem, RequirementExtraction, SearchRequest



logger = logging.getLogger("artisan.ai.buyer_search")


class SemanticMatchingEngine:
    """
    Hybrid Search & Reranking Engine for vendoKart Module 4.
    Orchestrates a state-of-the-art multi-stage retrieval pipeline:
    1. Requirement Extraction (NLU)
    2. Product Intent Semantic Search (BGE-M3 Dense Vector Similarity on Product Keyword ONLY)
    3. Hybrid Score Fusion (Dense BGE-M3 + Lexical Rule Matcher)
    4. Deterministic Hard Constraint Engine (Time-Based Production Capacity, Delivery Shipping Math, Budget, Location)
    5. BGE Reranker v2-M3 Cross-Encoder Reranking
    """

    SYNONYM_MAP = {
        "pot": ["pot", "pots", "pottery", "terracotta", "clay", "planter", "planters", "earthenware", "matka", "matkas"],
        "pots": ["pot", "pots", "pottery", "terracotta", "clay", "planter", "planters", "earthenware", "matka", "matkas"],
        "planter": ["pot", "pots", "pottery", "terracotta", "clay", "planter", "planters"],
        "planters": ["pot", "pots", "pottery", "terracotta", "clay", "planter", "planters"],
        "saree": ["saree", "sarees", "silk", "handloom", "weave", "woven", "pochampally", "kanchipuram"],
        "sarees": ["saree", "sarees", "silk", "handloom", "weave", "woven", "pochampally", "kanchipuram"],
        "lamp": ["lamp", "lamps", "diya", "diyas", "brass", "lighting", "lantern"],
        "lamps": ["lamp", "lamps", "diya", "diyas", "brass", "lighting", "lantern"],
        "basket": ["basket", "baskets", "bamboo", "cane", "weaving", "storage"],
        "baskets": ["basket", "baskets", "bamboo", "cane", "weaving", "storage"],
        "hanging": ["hanging", "hangings", "wall", "tapestry", "decor", "craft"],
        "hangings": ["hanging", "hangings", "wall", "tapestry", "decor", "craft"],
    }

    @classmethod
    def compute_lexical_score(cls, query_text: str, product: ProductItem) -> float:
        """Computes lexical/rule-based synonym match score between product query and product."""
        if not query_text or not query_text.strip():
            return 1.0

        query_tokens = [t for t in re.split(r"\W+", query_text.lower()) if len(t) > 1]
        if not query_tokens:
            return 1.0

        expanded_keywords = set(query_tokens)
        for token in query_tokens:
            if token in cls.SYNONYM_MAP:
                expanded_keywords.update(cls.SYNONYM_MAP[token])

        match_count = 0
        for kw in expanded_keywords:
            if kw in product.name.lower():
                match_count += 3
            elif kw in product.category.lower() or kw in product.craft_type.lower():
                match_count += 2
            elif kw in product.description.lower():
                match_count += 1

        return min(1.0, match_count / 5.0)

    @classmethod
    def match_and_rank(
        cls,
        products: List[ProductItem],
        request: SearchRequest,
        extracted: Optional[RequirementExtraction] = None,
    ) -> List[ProductItem]:
        raw_query = (request.query or "").strip()
        
        # 1. CRITICAL: Isolate Product Intent Keyword for BGE-M3 Dense Retrieval
        # Do NOT embed raw business constraints like "35 pots in 2 days"
        if extracted and extracted.product and extracted.product.strip():
            product_query_str = extracted.product.strip()
        elif request.ai_mode and extracted and not extracted.product:
            # AI Mode processed query but extracted NO product intent (e.g., "20 in 2 days")
            product_query_str = ""
        else:
            # Fallback: Strip numbers and delivery phrases if extraction omitted
            clean_q = re.sub(r"\b\d+\b", "", raw_query)
            clean_q = re.sub(r"\b(in|within|days|day|under|below|budget|rs|inr|₹|pcs|pieces)\b", "", clean_q, flags=re.IGNORECASE)
            product_query_str = clean_q.strip()

        logger.info(f"=== SEARCH PIPELINE INITIALIZED ===")
        logger.info(f"Raw User Query: '{raw_query}'")
        logger.info(f"Extracted Requirements: {extracted.model_dump(exclude_none=True) if extracted else None}")
        logger.info(f"BGE-M3 Product Semantic Query: '{product_query_str}'")

        # Check if any explicit filters are active
        has_active_filters = bool(
            request.price_range
            or request.min_price is not None
            or request.max_price is not None
            or request.quantity_range
            or request.min_qty is not None
            or request.max_qty is not None
            or (request.category and request.category != "All Categories")
            or (request.location_mode == "nearby" and request.user_location and request.user_location.strip())
            or (request.location_mode == "custom" and request.user_location and request.user_location.strip())
        )

        if not raw_query and not has_active_filters:
            logger.info("Default state (no search query & no active filters). Returning ALL existing products from ChromaDB.")
            sorted_products = list(products)
            sort = request.sort_by or "relevance"
            if sort == "price_asc":
                sorted_products.sort(key=lambda x: x.price)
            elif sort == "price_desc":
                sorted_products.sort(key=lambda x: x.price, reverse=True)
            elif sort == "rating":
                sorted_products.sort(key=lambda x: x.rating, reverse=True)
            elif sort == "delivery_time":
                sorted_products.sort(key=lambda x: x.delivery_days)
            return sorted_products

        hybrid_candidates: List[tuple[ProductItem, float]] = []

        if not raw_query:
            # No search query entered by user -> Pass all products to Stage 3 explicit filters
            logger.info("No search query entered. Applying explicit filters to candidate products.")
            hybrid_candidates = [(p, 1.0) for p in products]
        elif not product_query_str:
            # A search query was entered (e.g. "20 in 2 days") but contains NO product intent
            logger.info("Search query entered without product intent. Returning empty candidate pool.")
            return []
        else:
            # STAGE 1: Dense Semantic Product Retrieval via BGE-M3 on Product Intent Keyword ONLY
            dense_similarities = BGEEmbeddingEngine.get_semantic_similarities(product_query_str, products)

            # STAGE 2: Broad High-Recall Candidate Pool & Hybrid Score Fusion
            for p in products:
                dense_score = dense_similarities.get(p.id, 0.0)
                lexical_score = cls.compute_lexical_score(product_query_str, p)

                # Combine dense vector similarity (60%) and lexical score (40%)
                hybrid_score = 0.60 * dense_score + 0.40 * lexical_score

                # Keep candidate ONLY if product is semantically relevant to product_query_str
                # Threshold: dense similarity >= 0.30 OR lexical match >= 0.50 OR hybrid score >= 0.25
                is_relevant = (dense_score >= 0.30) or (lexical_score >= 0.50) or (hybrid_score >= 0.25)
                if not is_relevant:
                    logger.info(f"Candidate Rejected at Retrieval Stage: {p.name} (dense={dense_score:.3f}, lex={lexical_score:.3f}, hybrid={hybrid_score:.3f} below recall threshold)")
                    continue

                hybrid_candidates.append((p, hybrid_score))



        logger.info(f"Broad Candidate Pool Retrieved: {len(hybrid_candidates)} candidate products passed into Hard Constraint Engine")

        # STAGE 3: Deterministic Hard Constraint Filtering (Capacity, Shipping, Price, Location)
        hard_filtered_candidates: List[tuple[ProductItem, float]] = []

        target_qty = extracted.quantity if (request.ai_mode and extracted and extracted.quantity) else None
        deadline_days = (
            (extracted.deadline_days or extracted.max_delivery_days)
            if (request.ai_mode and extracted)
            else None
        )

        for p, h_score in hybrid_candidates:
            daily_capacity = getattr(p, "production_capacity_per_day", 20)
            shipping_days = getattr(p, "shipping_days", 0)

            logger.info(f"=== CANDIDATE EVALUATION: {p.name} ({p.id}) ===")
            logger.info(f"  Artisan Metrics: stock={p.stock}, capacity_per_day={daily_capacity}, shipping_days={shipping_days}, unit_price={getattr(p, 'price_per_unit', p.price)}")

            # 3A. Time-Based Production Capacity & Delivery Shipping Math
            if target_qty is not None:
                needed_production = max(0, target_qty - p.stock)
                required_prod_days = math.ceil(needed_production / daily_capacity) if (needed_production > 0 and daily_capacity > 0) else 0
                total_delivery_days = required_prod_days + shipping_days

                logger.info(f"  Capacity Math: requested={target_qty}, needed_prod={needed_production}, required_prod_days={required_prod_days}, shipping_days={shipping_days} -> total_delivery_days={total_delivery_days}")

                if deadline_days is not None:
                    # Calculate cumulative max capacity in available production days
                    available_prod_days = max(0, deadline_days - shipping_days)
                    max_producable = p.stock + (daily_capacity * available_prod_days)

                    is_capacity_eligible = (total_delivery_days <= deadline_days) or (max_producable >= target_qty)
                    logger.info(f"  Deadline Constraint Check ({deadline_days} days): total_delivery={total_delivery_days} days, max_producable={max_producable} -> Eligible: {is_capacity_eligible}")

                    if not is_capacity_eligible:
                        logger.info(f"  -> REJECTED {p.name}: Cannot satisfy {target_qty} units within {deadline_days} days (requires {total_delivery_days} days).")
                        continue
                else:
                    # Deadline NOT provided: verify overall capacity capability
                    max_capacity_window = p.stock + (daily_capacity * 14)
                    if max_capacity_window < target_qty:
                        logger.info(f"  -> REJECTED {p.name}: Cannot satisfy order volume of {target_qty} units (max 14-day capacity {max_capacity_window}).")
                        continue

            # 3B. Price & Budget Validation
            if request.ai_mode and extracted and extracted.max_budget is not None:
                max_b = extracted.max_budget
                unit_price = (
                    p.price_per_unit
                    if p.price_per_unit is not None
                    else (p.price / p.min_order_qty if p.min_order_qty > 0 else p.price)
                )

                if target_qty is not None:
                    total_cost = unit_price * target_qty
                    price_passed = (total_cost <= max_b or unit_price <= max_b or p.price <= max_b)
                    logger.info(f"  Budget Check (max_budget={max_b}): total_cost={total_cost}, unit_price={unit_price} -> Eligible: {price_passed}")
                    if not price_passed:
                        logger.info(f"  -> REJECTED {p.name}: Exceeds maximum budget constraint of ₹{max_b}.")
                        continue
                else:
                    price_passed = (p.price <= max_b or unit_price <= max_b)
                    logger.info(f"  Budget Check (max_budget={max_b}): product_price={p.price}, unit_price={unit_price} -> Eligible: {price_passed}")
                    if not price_passed:
                        logger.info(f"  -> REJECTED {p.name}: Exceeds maximum budget constraint of ₹{max_b}.")
                        continue

            # 3C. UI Manual Price Range Filter
            if request.price_range:
                pr = request.price_range.lower()
                if pr == "under_500" and p.price >= 500:
                    continue
                elif pr == "500_1000" and not (500 <= p.price <= 1000):
                    continue
                elif pr == "1000_3000" and not (1000 <= p.price <= 3000):
                    continue
                elif pr == "3000_5000" and not (3000 <= p.price <= 5000):
                    continue
                elif pr == "above_5000" and p.price <= 5000:
                    continue

            if request.min_price is not None and p.price < request.min_price:
                continue
            if request.max_price is not None and p.price > request.max_price:
                continue

            # 3D. UI Manual Quantity Range Filter
            if request.quantity_range:
                qr = request.quantity_range.lower()
                if qr == "1_10" and not (p.min_order_qty <= 10):
                    continue
                elif qr == "10_50" and not (10 <= p.min_order_qty <= 50 or 10 <= p.stock):
                    continue
                elif qr == "50_100" and not (50 <= p.min_order_qty <= 100 or 50 <= p.stock):
                    continue
                elif qr == "100_500" and not (p.stock >= 100 or p.production_capacity_per_day >= 20):
                    continue
                elif qr == "500_plus" and not (p.stock >= 500 or p.production_capacity_per_day >= 50):
                    continue

            if request.min_qty is not None and p.stock < request.min_qty:
                continue

            # 3E. Category Filter
            cat_filter = request.category or (extracted.category if (request.ai_mode and extracted) else None)
            if cat_filter and cat_filter != "All Categories":
                if cat_filter.lower() not in p.category.lower():
                    logger.info(f"  -> REJECTED {p.name}: Category mismatch (expected {cat_filter}, got {p.category}).")
                    continue

            # 3F. Location Filter & "Nearby Me"
            is_nearby = (
                request.location_mode == "nearby"
                or (extracted and extracted.location == "nearby")
            )
            user_loc = (request.user_location or "").strip().lower()

            if is_nearby:
                if user_loc:
                    loc_parts = [part.strip() for part in re.split(r"[\,\s]+", user_loc) if len(part) > 2]
                    matches_location = any(part in p.location.lower() for part in loc_parts)
                    if not matches_location:
                        if request.location_mode == "nearby":
                            logger.info(f"  -> REJECTED {p.name}: Location mismatch for Nearby Me mode.")
                            continue

            logger.info(f"  -> PASSED ALL CONSTRAINTS: {p.name}")
            hard_filtered_candidates.append((p, h_score))

        logger.info(f"Candidates Passed All Hard Constraints: {len(hard_filtered_candidates)}")

        # STAGE 4: BGE Reranker v2-M3 Reranking Stage
        reranked_candidates = BGERerankerEngine.rerank(product_query_str, hard_filtered_candidates)

        # STAGE 5: Sorting & Result Ordering
        sort = request.sort_by or "relevance"
        if sort == "price_asc":
            reranked_candidates.sort(key=lambda x: x[0].price)
        elif sort == "price_desc":
            reranked_candidates.sort(key=lambda x: x[0].price, reverse=True)
        elif sort == "rating":
            reranked_candidates.sort(key=lambda x: x[0].rating, reverse=True)
        elif sort == "delivery_time":
            reranked_candidates.sort(key=lambda x: x[0].delivery_days)
        elif sort == "nearest":
            user_loc = (request.user_location or "").lower()
            reranked_candidates.sort(
                key=lambda x: (
                    1 if any(part in x[0].location.lower() for part in user_loc.split(",")) else 0,
                    x[1],
                ),
                reverse=True,
            )
        else:
            reranked_candidates.sort(key=lambda x: x[1], reverse=True)

        logger.info(f"=== FINAL MATCHED PRODUCTS ({len(reranked_candidates)}) ===")
        for idx, (p, score) in enumerate(reranked_candidates, start=1):
            logger.info(f" #{idx}: {p.name} ({p.artisan_name}) | Final Score: {score:.3f}")

        return [item[0] for item in reranked_candidates]
