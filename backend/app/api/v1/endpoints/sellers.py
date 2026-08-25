from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_active_user, require_role
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.seller import (
    SellerLocationUpdate,
    SellerProfileResponse,
    SellerProfileUpdate,
    SellerPublicResponse,
)
from app.schemas.user import UserResponse
from app.services.seller_service import SellerService

router = APIRouter()


@router.get(
    "/me",
    response_model=SellerProfileResponse,
    summary="Get current seller profile & workspace data",
)
async def get_my_seller_profile(
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
):
    """Retrieve the full seller profile and production workspace information for the logged-in artisan."""
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")

    profile = await SellerService.get_or_create_profile(user_db)
    return profile


@router.put(
    "/me",
    response_model=SellerProfileResponse,
    summary="Create or update current seller profile & workspace information",
)
async def update_my_seller_profile(
    update_data: SellerProfileUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
):
    """Update artisan craft details, experience, workspace type, daily capacity, and labour parameters."""
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")

    updated_profile = await SellerService.update_profile(user_db, update_data)
    return updated_profile


@router.post(
    "/me/location",
    response_model=SellerProfileResponse,
    summary="Update live GPS location coordinates and workshop address",
)
async def update_my_seller_location(
    location_data: SellerLocationUpdate,
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
):
    """Record verified GPS coordinates and address for local artisan-buyer matching."""
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")

    updated_profile = await SellerService.update_location(user_db, location_data)
    return updated_profile


@router.get(
    "/",
    response_model=List[SellerPublicResponse],
    summary="List verified public artisan studios",
)
async def list_public_sellers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Public marketplace discovery endpoint to find onboarded craft studios."""
    return await SellerService.list_sellers(skip=skip, limit=limit)


@router.get(
    "/{seller_id}",
    response_model=SellerPublicResponse,
    summary="Get public artisan studio profile",
)
async def get_public_seller_profile(seller_id: str):
    """Public view of an artisan's verified studio, craft domains, and capacity."""
    return await SellerService.get_public_profile(seller_id)
