from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.seller import CraftCategory
from app.services.pricing_engine import PricingBreakdown


class ProductStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ProductDimensions(BaseModel):
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None


class ProductInDB(BaseModel):
    id: str = Field(alias="_id")
    seller_id: str
    user_id: str
    title: str
    description: str
    craft_category: CraftCategory
    craft_specialty: Optional[str] = None
    material_type: str = "Traditional Material"
    
    # Production parameter inputs
    material_cost_inr: float
    labour_daily_rate_inr: float = 400.0
    workers_count: int = 1
    daily_capacity_units: float = 5.0
    production_days: float = 1.0
    packaging_cost_inr: float = 20.0
    energy_cost_inr: float = 0.0
    other_direct_cost_inr: float = 0.0
    target_margin_percent: float = 25.0
    
    # Deterministic pricing outputs
    pricing: PricingBreakdown
    listed_price_inr: float
    
    # Inventory & fulfillment
    stock_quantity: int = 5
    lead_time_days: int = 3
    is_customizable: bool = False
    
    # Media & specs
    images: List[str] = Field(default_factory=list)
    dimensions: Optional[ProductDimensions] = None
    tags: List[str] = Field(default_factory=list)
    
    status: ProductStatus = ProductStatus.PUBLISHED
    views_count: int = 0
    orders_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "json_encoders": {datetime: lambda dt: dt.isoformat()},
    }
