import os
import sys
from pathlib import Path

# Resolve project & backend root directories for app.schemas imports
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import re
from typing import Dict, List, Optional, Tuple
from app.schemas.search import RequirementExtraction





class SearchRequirementExtractor:
    """
    NLU Requirement Extractor for vendoKart Module 4.
    Extracts structured procurement parameters (product keyword, quantity, max budget,
    delivery deadline in days, category, material, location) from arbitrary natural language query strings.
    The extraction is strictly order-independent, position-independent, and handles optional constraints.
    """

    CATEGORY_MAPPING = {
        "pot": "Pottery",
        "pots": "Pottery",
        "planter": "Pottery",
        "planters": "Pottery",
        "clay": "Pottery",
        "terracotta": "Pottery",
        "earthenware": "Pottery",
        "matka": "Pottery",
        "matkas": "Pottery",
        "saree": "Handloom",
        "sarees": "Handloom",
        "silk": "Handloom",
        "dupatta": "Textiles",
        "stole": "Textiles",
        "textile": "Textiles",
        "lamp": "Home Décor",
        "lamps": "Home Décor",
        "diya": "Home Décor",
        "diyas": "Home Décor",
        "brass": "Home Décor",
        "hanging": "Home Décor",
        "hangings": "Home Décor",
        "basket": "Bamboo",
        "baskets": "Bamboo",
        "bamboo": "Bamboo",
        "cane": "Bamboo",
        "wood": "Woodcraft",
        "wooden": "Woodcraft",
        "toy": "Woodcraft",
        "toys": "Woodcraft",
        "jewel": "Jewellery",
        "jewellery": "Jewellery",
        "necklace": "Jewellery",
        "earring": "Jewellery",
        "vase": "Home Décor",
        "vases": "Home Décor",
    }

    MATERIAL_KEYWORDS = {
        "clay": "Clay",
        "terracotta": "Terracotta",
        "brass": "Brass",
        "silk": "Silk",
        "bamboo": "Bamboo",
        "wood": "Wood",
        "wooden": "Wood",
        "cotton": "Cotton",
    }

    @classmethod
    def extract(cls, query: str) -> RequirementExtraction:
        if not query or not query.strip():
            return RequirementExtraction(query="")

        q_original = query.strip()
        q = q_original.lower()

        # 1. Extract Delivery Deadline (deadline_days)
        deadline_days: Optional[int] = None
        deadline_match = re.search(
            r"(?:within|in|by|need them in|deliver in|deadline of|less than)?\s*(\d+)\s*(?:day|days|d|working days|business days)\b",
            q,
        )
        if deadline_match:
            try:
                deadline_days = int(deadline_match.group(1))
            except ValueError:
                pass

        # 2. Extract Max Budget (max_budget)
        max_budget: Optional[float] = None
        # Match explicit budget triggers: "under 2000", "below 2000", "can spend up to 2000", "budget is 2000", "max 2000", "₹2000", "rs 2000"
        budget_match = re.search(
            r"(?:can spend up to|can spend|spend up to|budget is|budget of|budget|under|below|less than|<|max|maximum|up to|cost|price|rs\.?|inr|₹)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\,\d+)*)\b",
            q,
        )
        if budget_match:
            try:
                num_val = float(budget_match.group(1).replace(",", ""))
                if deadline_days is None or num_val != deadline_days:
                    max_budget = num_val
            except ValueError:
                pass

        # 3. Extract Target Quantity (quantity)
        quantity: Optional[int] = None
        qty_matches = re.finditer(r"\b(\d+)\b", q)
        for m in qty_matches:
            try:
                val = int(m.group(1))
                if deadline_days is not None and val == deadline_days:
                    continue
                if max_budget is not None and float(val) == max_budget:
                    continue
                quantity = val
                break
            except ValueError:
                pass

        # 4. Extract Product Keyword by stripping noise, constraints & filler phrases
        clean_text = q

        # Strip budget patterns
        clean_text = re.sub(
            r"(?:can spend up to|can spend|spend up to|budget is|budget of|budget|under|below|less than|<|max|maximum|up to|cost|price|rs\.?|inr|₹)\s*(?:₹|rs\.?|inr)?\s*\d+(?:\,\d+)*\b",
            " ",
            clean_text,
        )
        clean_text = re.sub(r"(?:₹|rs\.?|inr)\s*\d+(?:\,\d+)*\b", " ", clean_text)

        # Strip deadline patterns
        clean_text = re.sub(
            r"(?:within|in|by|need them in|deliver in|deadline of|less than)?\s*\d+\s*(?:day|days|d|working days|business days)\b",
            " ",
            clean_text,
        )

        # Strip extracted quantity number if found
        if quantity is not None:
            clean_text = re.sub(r"\b" + str(quantity) + r"\b", " ", clean_text)

        # Strip filler action words and punctuation
        clean_text = re.sub(
            r"\b(i need|need|needed|required|want|buying|looking for|order|bulk|pieces|pcs|units|items|set|sets|and|them|is|for|can|spend|up|to|budget|within|in|under|below|less|than|by|day|days|d)\b",
            " ",
            clean_text,
        )
        # Remove extra symbols and non-alphanumeric chars (except space)
        clean_text = re.sub(r"[^\w\s]", " ", clean_text)

        product_terms = [t for t in clean_text.strip().split() if len(t) > 1]
        extracted_product = " ".join(product_terms) if product_terms else None

        if not extracted_product and not (quantity or max_budget or deadline_days):
            extracted_product = q_original

        # 5. Infer Category
        category: Optional[str] = None
        if product_terms:
            for word in product_terms:
                if word in cls.CATEGORY_MAPPING:
                    category = cls.CATEGORY_MAPPING[word]
                    break

        # 6. Infer Material
        material: Optional[str] = None
        for word in (product_terms or []):
            if word in cls.MATERIAL_KEYWORDS:
                material = cls.MATERIAL_KEYWORDS[word]
                break

        # 7. Extract Location
        location: Optional[str] = None
        if "nearby" in q or "near me" in q:
            location = "nearby"
        elif "kumbakonam" in q:
            location = "Kumbakonam"
        elif "jaipur" in q:
            location = "Jaipur"
        elif "auroville" in q:
            location = "Auroville"
        elif "chennai" in q:
            location = "Chennai"

        return RequirementExtraction(
            query=q_original,
            product=extracted_product,
            quantity=quantity,
            max_budget=max_budget,
            budget_type="total" if (quantity and max_budget) else "per_unit",
            deadline_days=deadline_days,
            max_delivery_days=deadline_days,
            category=category,
            material=material,
            craft_material=material,
            location=location,
            other_requirements=[],
        )
