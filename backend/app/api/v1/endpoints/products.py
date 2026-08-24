from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_active_user, require_role
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.product import (
    PricingPreviewRequest,
    PricingPreviewResponse,
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
)
from app.schemas.user import UserResponse
from app.services.product_service import ProductService

router = APIRouter()


@router.post("/pricing-preview", response_model=PricingPreviewResponse)
async def preview_pricing(
    req: PricingPreviewRequest,
) -> PricingPreviewResponse:
    """
    Real-time deterministic pricing calculation preview (§11).
    Calculates unit labour cost, total cost, floor price, and fair recommended price.
    """
    return await ProductService.calculate_pricing_preview(req)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    req: ProductCreateRequest,
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
) -> ProductResponse:
    """
    Create a new artisan product listing with deterministic pricing calculation.
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await ProductService.create_product(user_db, req)


@router.get("/me", response_model=List[ProductResponse])
async def get_my_products(
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
) -> List[ProductResponse]:
    """
    Get all products created by the current logged-in artisan.
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await ProductService.get_seller_products(user_db)


@router.get("/marketplace", response_model=List[ProductResponse])
async def list_marketplace_products(
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = Query(None),
) -> List[ProductResponse]:
    """
    Public marketplace endpoint to browse published craft objects.
    """
    return await ProductService.list_marketplace_products(limit=limit, category=category)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    product_id: str,
) -> ProductResponse:
    """
    Get details of a single product listing.
    """
    return await ProductService.get_product_by_id(product_id)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    req: ProductUpdateRequest,
    current_user: UserResponse = Depends(get_current_active_user),
) -> ProductResponse:
    """
    Update a product listing and recalculate deterministic pricing if cost inputs change.
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await ProductService.update_product(product_id, user_db, req)


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Delete a product listing.
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await ProductService.delete_product(product_id, user_db)
