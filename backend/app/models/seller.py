from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


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
