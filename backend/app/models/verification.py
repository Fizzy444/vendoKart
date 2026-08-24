from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class RiskTier(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ImageQualityMetrics(BaseModel):
    brightness_score: float = 0.0  # 0-255
    sharpness_score: float = 0.0
    is_live_capture: bool = True
    dhash: Optional[str] = None


class VerificationEvidenceInDB(BaseModel):
    id: str = Field(alias="_id")
    seller_id: str
    user_id: str
    phone: str
    
    # 5-Image / 3-Image presence captures (§12)
    workspace_photo: str
    process_photo: str
    finished_product_photo: str
    additional_photos: List[str] = Field(default_factory=list)
    
    # Signals
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Trust & fraud evaluations (§12)
    trust_score: int = 0  # 0-100
    risk_tier: RiskTier = RiskTier.LOW
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
    
    # Perceptual hashes for duplicate detection
    image_hashes: List[str] = Field(default_factory=list)
    is_duplicate_flagged: bool = False
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
    }
