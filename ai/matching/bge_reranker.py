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
from typing import Dict, List, Optional, Tuple
from app.schemas.search import ProductItem



logger = logging.getLogger("artisan.ai.bge_reranker")

_BGE_RERANKER_MODEL = None


class BGERerankerEngine:
    """
    BGE Reranker v2-M3 Stage for vendoKart Module 4.
    Uses BAAI/bge-reranker-v2-m3 cross-encoder model to perform fine-grained cross-attention reranking
    on candidate products that passed deterministic hard constraint filters.
    """

    MODEL_NAME = "BAAI/bge-reranker-v2-m3"

    @classmethod
    def get_model(cls):
        global _BGE_RERANKER_MODEL
        if _BGE_RERANKER_MODEL is None:
            if os.environ.get("USE_TRANSFORMERS_MODEL", "0") != "1":
                _BGE_RERANKER_MODEL = False
                return None
            try:
                from sentence_transformers import CrossEncoder
                logger.info(f"Loading BGE Reranker model '{cls.MODEL_NAME}'...")
                _BGE_RERANKER_MODEL = CrossEncoder(cls.MODEL_NAME)
                logger.info("BGE Reranker model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load CrossEncoder '{cls.MODEL_NAME}': {e}. Using rule-based reranking fallback.")
                _BGE_RERANKER_MODEL = False
        return _BGE_RERANKER_MODEL if _BGE_RERANKER_MODEL is not False else None

    @classmethod
    def rerank(
        cls,
        query: str,
        candidates: List[Tuple[ProductItem, float]],
    ) -> List[Tuple[ProductItem, float]]:
        """
        Reranks a list of candidate tuples `(product, hybrid_score)` using BGE Reranker v2-M3.
        Returns re-scored and re-ordered candidates.
        """
        if not candidates or not query or not query.strip():
            return candidates

        model = cls.get_model()

        if model is not None:
            try:
                pairs = []
                for product, _ in candidates:
                    passage = f"{product.name} - {product.craft_type}. {product.description} Location: {product.location}."
                    pairs.append((query.strip(), passage))

                scores = model.predict(pairs)
                reranked = []
                for (product, prev_score), cross_score in zip(candidates, scores):
                    # Combine cross-encoder score with previous hybrid score
                    combined_score = float(cross_score) * 0.5 + prev_score * 0.5
                    reranked.append((product, combined_score))

                reranked.sort(key=lambda x: x[1], reverse=True)
                return reranked
            except Exception as e:
                logger.warning(f"Error during BGE Reranker prediction: {e}. Preserving hybrid scores.")

        # Fallback Cross-Feature Reranking (Weighted Score Fusion)
        reranked = []
        for product, hybrid_score in candidates:
            final_score = hybrid_score
            # Boost rating & verified status in reranking
            if product.is_verified_artisan:
                final_score += 0.05
            if product.rating:
                final_score += (product.rating / 5.0) * 0.05
            reranked.append((product, final_score))

        reranked.sort(key=lambda x: x[1], reverse=True)
        return reranked
