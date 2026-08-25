import sys
import logging
from pathlib import Path
from typing import Optional

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ai.matching.buyer_search import SemanticMatchingEngine
from ai.orchestrator.search_extractor import SearchRequirementExtractor
from app.repositories.product_repository import ProductRepository
from app.schemas.search import RequirementExtraction, SearchRequest, SearchResponse

logger = logging.getLogger("artisan.search")


class SearchService:
    """
    Search Service orchestrating Natural Language Requirement Extraction,
    Semantic Product Search, Database Filtering, and Result Ranking.
    """

    @classmethod
    async def search(cls, request: SearchRequest) -> SearchResponse:
        logger.info(f"Processing search request: query='{request.query}', ai_mode={request.ai_mode}, location_mode={request.location_mode}")

        extracted: Optional[RequirementExtraction] = None
        if request.ai_mode and request.query and request.query.strip():
            extracted = SearchRequirementExtractor.extract(request.query)

        # Retrieve all candidate products from database/repository
        candidate_products = await ProductRepository.get_all_products()

        # Perform semantic matching, hard filtering, location calculation, and ranking
        matched_products = SemanticMatchingEngine.match_and_rank(
            products=candidate_products,
            request=request,
            extracted=extracted,
        )

        return SearchResponse(
            query=request.query,
            ai_mode=request.ai_mode,
            extracted_requirements=extracted,
            total_results=len(matched_products),
            products=matched_products,
        )
