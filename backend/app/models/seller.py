import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class CraftCategory(str, Enum):
    BAMBOO = "Bamboo Craft"
    HANDLOOM = "Handloom & Textiles"
    POTTERY = "Pottery & Ceramics"
    WOODWORK = "Woodworking & Carving"
    METAL = "Metal Craft & Bell Metal"
    JEWELLERY = "Handmade Jewellery"
    TERRACOTTA = "Terracotta"
    EMBROIDERY = "Embroidery & Needlework"
    LEATHER = "Leather Craft"
    PAINTING = "Traditional Painting & Folk Art"
    STONE = "Stone Carving"
    OTHER = "Other Craft"


class SellerType(str, Enum):
    INDIVIDUAL = "individual_artisan"
    INDEPENDENT = "independent_artisan"
    FAMILY = "family_business"
    COOPERATIVE = "cooperative"
    SELF_HELP_GROUP = "self_help_group"
    RURAL_PRODUCER = "rural_producer_group"
    SMALL_RETAIL = "small_retail"


class WorkspaceType(str, Enum):
    HOME_WORKSHOP = "home_workshop"
    DEDICATED_STUDIO = "dedicated_studio"
    COMMUNITY_SHED = "community_shed"
    COOPERATIVE_CENTER = "cooperative_center"


class SellerLocation(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    captured_at: Optional[datetime] = None


class SellerProfileInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    phone: str
    artisan_name: Optional[str] = None
    business_name: Optional[str] = None
    bio: Optional[str] = None
    craft_category: CraftCategory = CraftCategory.OTHER
    craft_specialties: List[str] = []
    experience_years: int = 1
    seller_type: SellerType = SellerType.INDIVIDUAL
    workspace_type: WorkspaceType = WorkspaceType.HOME_WORKSHOP
    number_of_workers: int = 1
    daily_labour_rate_inr: float = 400.0
    daily_capacity_units: int = 5
    lead_time_days: int = 3
    location: Optional[SellerLocation] = None
    workspace_photos: List[str] = []
    verification_status: str = "pending"  # "pending" | "verified" | "needs_review"
    trust_score: float = 60.0
    is_onboarded: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)


class SellerProfileModel(Base):
    __tablename__ = "sellers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    artisan_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    craft_category: Mapped[str] = mapped_column(String(100), default=CraftCategory.OTHER.value)
    craft_specialties: Mapped[List[str]] = mapped_column(JSON, default=list)
    experience_years: Mapped[int] = mapped_column(Integer, default=1)
    seller_type: Mapped[str] = mapped_column(String(50), default=SellerType.INDIVIDUAL.value)
    workspace_type: Mapped[str] = mapped_column(String(50), default=WorkspaceType.HOME_WORKSHOP.value)
    number_of_workers: Mapped[int] = mapped_column(Integer, default=1)
    daily_labour_rate_inr: Mapped[float] = mapped_column(Float, default=400.0)
    daily_capacity_units: Mapped[int] = mapped_column(Integer, default=5)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3)
    
    # Explicit coordinate and geographic columns in PostgreSQL
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    workspace_photos: Mapped[List[str]] = mapped_column(JSON, default=list)
    verification_status: Mapped[str] = mapped_column(String(50), default="pending")
    trust_score: Mapped[float] = mapped_column(Float, default=60.0)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> SellerProfileInDB:
        category_enum = CraftCategory.OTHER
        try:
            category_enum = CraftCategory(self.craft_category)
        except ValueError:
            pass

        seller_type_enum = SellerType.INDIVIDUAL
        try:
            seller_type_enum = SellerType(self.seller_type)
        except ValueError:
            pass

        workspace_type_enum = WorkspaceType.HOME_WORKSHOP
        try:
            workspace_type_enum = WorkspaceType(self.workspace_type)
        except ValueError:
            pass

        loc = None
        if self.location and isinstance(self.location, dict):
            loc_data = dict(self.location)
            if loc_data.get("latitude") is None and self.latitude is not None:
                loc_data["latitude"] = self.latitude
            if loc_data.get("longitude") is None and self.longitude is not None:
                loc_data["longitude"] = self.longitude
            loc = SellerLocation(**loc_data)
        elif self.latitude is not None or self.longitude is not None:
            loc = SellerLocation(
                latitude=self.latitude,
                longitude=self.longitude,
                address=self.address,
                city=self.city,
                district=self.district,
                state=self.state,
                pincode=self.pincode,
            )

        return SellerProfileInDB(
            _id=str(self.id),
            user_id=str(self.user_id),
            phone=self.phone,
            artisan_name=self.artisan_name,
            business_name=self.business_name,
            bio=self.bio,
            craft_category=category_enum,
            craft_specialties=self.craft_specialties or [],
            experience_years=self.experience_years or 1,
            seller_type=seller_type_enum,
            workspace_type=workspace_type_enum,
            number_of_workers=self.number_of_workers or 1,
            daily_labour_rate_inr=float(self.daily_labour_rate_inr or 400.0),
            daily_capacity_units=int(self.daily_capacity_units or 5),
            lead_time_days=int(self.lead_time_days or 3),
            location=loc,
            workspace_photos=self.workspace_photos or [],
            verification_status=self.verification_status or "pending",
            trust_score=float(self.trust_score or 60.0),
            is_onboarded=bool(self.is_onboarded),
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
