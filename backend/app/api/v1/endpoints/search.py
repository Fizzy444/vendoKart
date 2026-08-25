import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.repositories.product_repository import ProductRepository
from app.schemas.response import GenericResponse
from app.schemas.search import ProductItem, SearchRequest, SearchResponse
from app.services.search_service import SearchService

logger = logging.getLogger("artisan.api.search")
router = APIRouter()


@router.post("", response_model=SearchResponse)
async def search_products(request: SearchRequest):
    """
    Unified search endpoint supporting simple product keywords, complex natural-language
    buying requirements, AI Mode extraction, multi-condition hard filters, and Nearby Me logic.
    """
    return await SearchService.search(request)


@router.get("/products/{product_id}", response_model=ProductItem)
async def get_product_details(product_id: str):
    """
    Retrieve comprehensive details for a specific artisan product by ID.
    """
    product = await ProductRepository.get_product_by_id(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )
    return product


@router.post("/products/{product_id}/favorite", response_model=ProductItem)
async def toggle_product_favorite(product_id: str):
    """
    Toggle favorite status for an artisan product.
    """
    product = await ProductRepository.toggle_favorite(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found.",
        )
    return product
