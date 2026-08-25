from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_active_user, require_role
from app.models.user import UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse
from app.schemas.verification import (
    ImageIntegrityCheckRequest,
    ImageIntegrityCheckResponse,
    LiveEvidenceSubmissionRequest,
    TrustSignalBreakdown,
    VerificationResponse,
)
from app.services.trust_service import TrustService

router = APIRouter()


@router.post(
    "/submit-live-evidence",
    response_model=VerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit 3-Photo/5-Photo Live Camera Evidence for Presence Verification",
)
async def submit_live_evidence(
    req: LiveEvidenceSubmissionRequest,
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
) -> VerificationResponse:
    """
    Submits live camera captures (Workspace, Making Process, Finished Product)
    with perceptual image hashing, duplicate checks, and computes the new Trust Score (§12).
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await TrustService.submit_live_evidence(user_db, req)


@router.get(
    "/status",
    response_model=TrustSignalBreakdown,
    summary="Get Current Artisan Trust Score & Signal Breakdown",
)
async def get_verification_status(
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
) -> TrustSignalBreakdown:
    """
    Retrieves the artisan's weighted trust signals (Phone OTP, GPS, Live Camera, Profile completeness).
    """
    user_db = await UserRepository.get_by_id(current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User record not found")
    return await TrustService.get_seller_verification_status(user_db)
