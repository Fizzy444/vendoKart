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

import logging
import math
from typing import Dict, List, Optional, Tuple
from app.schemas.search import ProductItem



logger = logging.getLogger("artisan.ai.bge_embedder")

# Global singleton model cache
_BGE_M3_MODEL = None
_PRODUCT_EMBEDDING_CACHE: Dict[str, List[float]] = {}


class BGEEmbeddingEngine:
    """
    BGE-M3 Dense Vector Embedding Engine for vendoKart.
    Uses BAAI/bge-m3 dense vector representations to perform true semantic retrieval,
    enabling non-keyword semantic matches (e.g. "something to keep plants in" -> "Terracotta Planters / Pots").
    Includes pre-computed semantic vector space with lazy-loading model support.
    """

    MODEL_NAME = "BAAI/bge-m3"

    # Pre-defined semantic concept vectors for craft domain (for fast offline fallback vector similarity)
    SEMANTIC_CONCEPTS = {
        "plant": ["pot", "pots", "planter", "planters", "clay", "terracotta", "garden", "earthen", "flora", "botanical"],
        "garden": ["pot", "pots", "planter", "planters", "clay", "terracotta", "earthenware"],
        "keep": ["container", "storage", "pot", "planter", "basket", "vase", "matka"],
        "store": ["basket", "baskets", "storage", "container", "box"],
        "wear": ["saree", "sarees", "silk", "handloom", "dupatta", "stole", "attire"],
        "drape": ["saree", "sarees", "silk", "handloom", "dupatta"],
        "light": ["lamp", "lamps", "diya", "diyas", "brass", "lighting", "lantern"],
        "illuminate": ["lamp", "lamps", "diya", "diyas", "lighting"],
        "decor": ["hanging", "vase", "lamp", "diya", "macrame", "puppet", "craft"],
        "flower": ["vase", "vases", "pot", "planter", "decor"],
    }

    @classmethod
    def get_model(cls):
        global _BGE_M3_MODEL
        if _BGE_M3_MODEL is None:
            if os.environ.get("USE_TRANSFORMERS_MODEL", "0") != "1":
                _BGE_M3_MODEL = False
                return None
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading BGE-M3 model '{cls.MODEL_NAME}'...")
                _BGE_M3_MODEL = SentenceTransformer(cls.MODEL_NAME)
                logger.info("BGE-M3 model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer '{cls.MODEL_NAME}': {e}. Using semantic vector space fallback.")
                _BGE_M3_MODEL = False
        return _BGE_M3_MODEL if _BGE_M3_MODEL is not False else None


    @classmethod
    def compute_cosine_similarity(cls, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        """Generates dense vector embedding for input text using BGE-M3 or concept vector fallback."""
        model = cls.get_model()
        if model is not None:
            try:
                return model.encode(text, convert_to_numpy=True).tolist()
            except Exception as e:
                logger.warning(f"Error during BGE-M3 encoding in get_embedding: {e}")
        return cls._create_concept_vector(text)

    @classmethod
    def _create_concept_vector(cls, text: str) -> List[float]:
        """Creates a semantic concept vector representing key craft intents."""
        t_low = text.lower()
        vec = []
        for concept, terms in cls.SEMANTIC_CONCEPTS.items():
            score = 0.0
            if concept in t_low:
                score += 2.0
            for term in terms:
                if term in t_low:
                    score += 1.0
            vec.append(score)
        return vec

    @classmethod
    def get_semantic_similarities(cls, query: str, products: List[ProductItem]) -> Dict[str, float]:
        """
        Computes dense semantic similarity scores between query and all candidate products.
        Returns a map of {product_id: similarity_score}.
        """
        if not query or not query.strip():
            return {p.id: 1.0 for p in products}

        query_str = query.strip()
        model = cls.get_model()

        if model is not None:
            try:
                # 1. Compute query vector using BGE-M3
                q_emb = model.encode(query_str, convert_to_numpy=True).tolist()

                results = {}
                for p in products:
                    if p.id not in _PRODUCT_EMBEDDING_CACHE:
                        p_doc = f"{p.name}. {p.description}. Category: {p.category}. Craft: {p.craft_type}."
                        _PRODUCT_EMBEDDING_CACHE[p.id] = model.encode(p_doc, convert_to_numpy=True).tolist()
                    
                    p_emb = _PRODUCT_EMBEDDING_CACHE[p.id]
                    sim = cls.compute_cosine_similarity(q_emb, p_emb)
                    results[p.id] = max(0.0, min(1.0, sim))
                return results
            except Exception as e:
                logger.warning(f"Error during BGE-M3 encoding: {e}. Falling back to semantic vector space.")

        # Fallback Semantic Vector Space Computation
        q_vec = cls._create_concept_vector(query_str)
        results = {}
        for p in products:
            p_doc = f"{p.name} {p.description} {p.category} {p.craft_type}"
            p_vec = cls._create_concept_vector(p_doc)
            sim = cls.compute_cosine_similarity(q_vec, p_vec)
            
            # Boost if query concept matches product craft category
            q_low = query_str.lower()
            if any(k in q_low for k in ["plant", "plants", "keep plants", "flora", "garden"]) and ("pot" in p.name.lower() or "planter" in p.name.lower() or "clay" in p.description.lower()):
                sim = max(sim, 0.85)
            elif any(k in q_low for k in ["drape", "wear", "ethnic"]) and ("saree" in p.name.lower() or "handloom" in p.category.lower()):
                sim = max(sim, 0.85)
            elif any(k in q_low for k in ["light", "illuminate", "lamp"]) and ("diya" in p.name.lower() or "lamp" in p.name.lower()):
                sim = max(sim, 0.85)
            elif any(k in q_low for k in ["store", "storage", "carry"]) and ("basket" in p.name.lower() or "bamboo" in p.category.lower()):
                sim = max(sim, 0.85)

            results[p.id] = max(0.0, min(1.0, sim))


        return results
