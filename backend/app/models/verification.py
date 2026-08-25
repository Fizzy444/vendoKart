import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


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

    model_config = ConfigDict(populate_by_name=True)


class VerificationEvidenceModel(Base):
    __tablename__ = "verification_evidences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"verif_{uuid.uuid4().hex[:12]}")
    seller_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    
    workspace_photo: Mapped[str] = mapped_column(Text, nullable=False)
    process_photo: Mapped[str] = mapped_column(Text, nullable=False)
    finished_product_photo: Mapped[str] = mapped_column(Text, nullable=False)
    additional_photos: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    trust_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_tier: Mapped[str] = mapped_column(String(50), default=RiskTier.LOW.value)
    verification_status: Mapped[str] = mapped_column(String(50), default=VerificationStatus.VERIFIED.value)
    
    image_hashes: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_duplicate_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> VerificationEvidenceInDB:
        risk_enum = RiskTier.LOW
        try:
            risk_enum = RiskTier(self.risk_tier)
        except ValueError:
            pass

        v_enum = VerificationStatus.VERIFIED
        try:
            v_enum = VerificationStatus(self.verification_status)
        except ValueError:
            pass

        return VerificationEvidenceInDB(
            _id=str(self.id),
            seller_id=str(self.seller_id),
            user_id=str(self.user_id),
            phone=self.phone,
            workspace_photo=self.workspace_photo,
            process_photo=self.process_photo,
            finished_product_photo=self.finished_product_photo,
            additional_photos=self.additional_photos or [],
            location_lat=self.location_lat,
            location_lon=self.location_lon,
            ip_address=self.ip_address,
            user_agent=self.user_agent,
            trust_score=int(self.trust_score or 0),
            risk_tier=risk_enum,
            verification_status=v_enum,
            image_hashes=self.image_hashes or [],
            is_duplicate_flagged=bool(self.is_duplicate_flagged),
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
