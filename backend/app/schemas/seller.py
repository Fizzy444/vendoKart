from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.seller import CraftCategory, SellerType, WorkspaceType, SellerLocation


class SellerLocationUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class SellerProfileCreate(BaseModel):
    artisan_name: Optional[str] = None
    business_name: Optional[str] = None
    bio: Optional[str] = None
    craft_category: CraftCategory = CraftCategory.OTHER
    craft_specialties: List[str] = []
    experience_years: int = Field(default=1, ge=0, le=70)
    seller_type: SellerType = SellerType.INDIVIDUAL
    workspace_type: WorkspaceType = WorkspaceType.HOME_WORKSHOP
    number_of_workers: int = Field(default=1, ge=1, le=500)
    daily_labour_rate_inr: float = Field(default=400.0, ge=0.0)
    daily_capacity_units: int = Field(default=5, ge=1, le=10000)
    lead_time_days: int = Field(default=3, ge=0, le=180)
    location: Optional[SellerLocationUpdate] = None


class SellerProfileUpdate(BaseModel):
    artisan_name: Optional[str] = None
    business_name: Optional[str] = None
    bio: Optional[str] = None
    craft_category: Optional[CraftCategory] = None
    craft_specialties: Optional[List[str]] = None
    experience_years: Optional[int] = Field(default=None, ge=0, le=70)
    seller_type: Optional[SellerType] = None
    workspace_type: Optional[WorkspaceType] = None
    number_of_workers: Optional[int] = Field(default=None, ge=1, le=500)
    daily_labour_rate_inr: Optional[float] = Field(default=None, ge=0.0)
    daily_capacity_units: Optional[int] = Field(default=None, ge=1, le=10000)
    lead_time_days: Optional[int] = Field(default=None, ge=0, le=180)
    location: Optional[SellerLocationUpdate] = None
    workspace_photos: Optional[List[str]] = None
    is_onboarded: Optional[bool] = None


class SellerProfileResponse(BaseModel):
    id: str
    user_id: str
    phone: str
    artisan_name: Optional[str] = None
    business_name: Optional[str] = None
    bio: Optional[str] = None
    craft_category: CraftCategory
    craft_specialties: List[str]
    experience_years: int
    seller_type: SellerType
    workspace_type: WorkspaceType
    number_of_workers: int
    daily_labour_rate_inr: float
    daily_capacity_units: int
    lead_time_days: int
    location: Optional[SellerLocation] = None
    workspace_photos: List[str]
    verification_status: str
    trust_score: float
    is_onboarded: bool
    created_at: datetime
    updated_at: datetime


class SellerPublicResponse(BaseModel):
    id: str
    artisan_name: Optional[str] = None
    business_name: Optional[str] = None
    bio: Optional[str] = None
    craft_category: CraftCategory
    craft_specialties: List[str]
    experience_years: int
    seller_type: SellerType
    daily_capacity_units: int
    lead_time_days: int
    city: Optional[str] = None
    state: Optional[str] = None
    verification_status: str
    trust_score: float
