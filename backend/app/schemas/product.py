from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.seller import CraftCategory
from app.models.product import ProductDimensions, ProductStatus
from app.services.pricing_engine import PricingBreakdown, PricingInputs


class ProductCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=5)
    craft_category: CraftCategory
    craft_specialty: Optional[str] = None
    material_type: str = "Traditional Material"
    
    # Cost & production inputs
    material_cost_inr: float = Field(..., ge=0)
    labour_daily_rate_inr: Optional[float] = Field(default=None, ge=0)
    workers_count: Optional[int] = Field(default=None, ge=1)
    daily_capacity_units: Optional[float] = Field(default=None, gt=0)
    production_days: float = Field(default=1.0, gt=0)
    packaging_cost_inr: float = Field(default=20.0, ge=0)
    energy_cost_inr: float = Field(default=0.0, ge=0)
    other_direct_cost_inr: float = Field(default=0.0, ge=0)
    target_margin_percent: float = Field(default=25.0, ge=5.0, le=100.0)
    
    # Optional override price (must be >= floor price)
    custom_listed_price_inr: Optional[float] = Field(default=None, ge=0)
    
    # Inventory & media
    stock_quantity: int = Field(default=5, ge=0)
    lead_time_days: int = Field(default=3, ge=0)
    is_customizable: bool = False
    images: List[str] = Field(default_factory=list)
    dimensions: Optional[ProductDimensions] = None
    tags: List[str] = Field(default_factory=list)
    status: ProductStatus = ProductStatus.PUBLISHED


class ProductUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    craft_category: Optional[CraftCategory] = None
    craft_specialty: Optional[str] = None
    material_type: Optional[str] = None
    
    material_cost_inr: Optional[float] = Field(default=None, ge=0)
    labour_daily_rate_inr: Optional[float] = Field(default=None, ge=0)
    workers_count: Optional[int] = Field(default=None, ge=1)
    daily_capacity_units: Optional[float] = Field(default=None, gt=0)
    production_days: Optional[float] = Field(default=None, gt=0)
    packaging_cost_inr: Optional[float] = Field(default=None, ge=0)
    energy_cost_inr: Optional[float] = Field(default=None, ge=0)
    other_direct_cost_inr: Optional[float] = Field(default=None, ge=0)
    target_margin_percent: Optional[float] = Field(default=None, ge=5.0, le=100.0)
    
    custom_listed_price_inr: Optional[float] = Field(default=None, ge=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    lead_time_days: Optional[int] = Field(default=None, ge=0)
    is_customizable: Optional[bool] = None
    images: Optional[List[str]] = None
    dimensions: Optional[ProductDimensions] = None
    tags: Optional[List[str]] = None
    status: Optional[ProductStatus] = None


class ProductResponse(BaseModel):
    id: str
    seller_id: str
    user_id: str
    title: str
    description: str
    craft_category: CraftCategory
    craft_specialty: Optional[str] = None
    material_type: str
    
    material_cost_inr: float
    labour_daily_rate_inr: float
    workers_count: int
    daily_capacity_units: float
    production_days: float
    packaging_cost_inr: float
    energy_cost_inr: float
    other_direct_cost_inr: float
    target_margin_percent: float
    
    pricing: PricingBreakdown
    listed_price_inr: float
    
    stock_quantity: int
    lead_time_days: int
    is_customizable: bool
    images: List[str]
    dimensions: Optional[ProductDimensions] = None
    tags: List[str]
    status: ProductStatus
    views_count: int
    orders_count: int
    created_at: datetime
    updated_at: datetime


class PricingPreviewRequest(PricingInputs):
    pass


class PricingPreviewResponse(BaseModel):
    pricing: PricingBreakdown
