from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.verification import RiskTier, VerificationStatus


class LiveEvidenceSubmissionRequest(BaseModel):
    workspace_photo: str = Field(..., description="Base64 data URI or URL of live workspace capture")
    process_photo: str = Field(..., description="Base64 data URI or URL of artisan crafting process")
    finished_product_photo: str = Field(..., description="Base64 data URI or URL of finished craft piece")
    additional_photos: List[str] = Field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TrustSignalBreakdown(BaseModel):
    phone_otp_verified: bool = True
    phone_score_pts: int = 30
    location_verified: bool = False
    location_score_pts: int = 0
    live_camera_evidence_verified: bool = False
    live_camera_score_pts: int = 0
    profile_completion_verified: bool = False
    profile_completion_score_pts: int = 0
    duplicate_image_flag: bool = False
    total_trust_score: int = 30
    risk_tier: RiskTier = RiskTier.MEDIUM
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED


class VerificationResponse(BaseModel):
    id: str
    seller_id: str
    user_id: str
    trust_score: int
    risk_tier: RiskTier
    verification_status: VerificationStatus
    is_duplicate_flagged: bool
    signals: TrustSignalBreakdown
    created_at: datetime


class ImageIntegrityCheckRequest(BaseModel):
    image_data: str = Field(..., description="Base64 data URI of the captured photo")


class ImageIntegrityCheckResponse(BaseModel):
    is_acceptable: bool
    brightness_val: float
    sharpness_val: float
    dhash: str
    feedback: str
