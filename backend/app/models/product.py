import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.models.seller import CraftCategory
from app.schemas.pricing import PricingBreakdown


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

    model_config = ConfigDict(populate_by_name=True)


class ProductModel(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    seller_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    craft_category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    craft_specialty: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    material_type: Mapped[str] = mapped_column(String(100), default="Traditional Material")
    
    material_cost_inr: Mapped[float] = mapped_column(Float, nullable=False)
    labour_daily_rate_inr: Mapped[float] = mapped_column(Float, default=400.0)
    workers_count: Mapped[int] = mapped_column(Integer, default=1)
    daily_capacity_units: Mapped[float] = mapped_column(Float, default=5.0)
    production_days: Mapped[float] = mapped_column(Float, default=1.0)
    packaging_cost_inr: Mapped[float] = mapped_column(Float, default=20.0)
    energy_cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    other_direct_cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    target_margin_percent: Mapped[float] = mapped_column(Float, default=25.0)
    
    pricing: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    listed_price_inr: Mapped[float] = mapped_column(Float, nullable=False)
    
    stock_quantity: Mapped[int] = mapped_column(Integer, default=5)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=3)
    is_customizable: Mapped[bool] = mapped_column(Boolean, default=False)
    
    images: Mapped[List[str]] = mapped_column(JSON, default=list)
    dimensions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    status: Mapped[str] = mapped_column(String(50), default=ProductStatus.PUBLISHED.value, index=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    orders_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> ProductInDB:
        category_enum = CraftCategory.OTHER
        try:
            category_enum = CraftCategory(self.craft_category)
        except ValueError:
            pass

        status_enum = ProductStatus.PUBLISHED
        try:
            status_enum = ProductStatus(self.status)
        except ValueError:
            pass

        dims = None
        if self.dimensions and isinstance(self.dimensions, dict):
            dims = ProductDimensions(**self.dimensions)

        pricing_obj = PricingBreakdown(**self.pricing) if isinstance(self.pricing, dict) else self.pricing

        return ProductInDB(
            _id=str(self.id),
            seller_id=str(self.seller_id),
            user_id=str(self.user_id),
            title=self.title,
            description=self.description,
            craft_category=category_enum,
            craft_specialty=self.craft_specialty,
            material_type=self.material_type,
            material_cost_inr=float(self.material_cost_inr),
            labour_daily_rate_inr=float(self.labour_daily_rate_inr),
            workers_count=int(self.workers_count),
            daily_capacity_units=float(self.daily_capacity_units),
            production_days=float(self.production_days),
            packaging_cost_inr=float(self.packaging_cost_inr),
            energy_cost_inr=float(self.energy_cost_inr),
            other_direct_cost_inr=float(self.other_direct_cost_inr),
            target_margin_percent=float(self.target_margin_percent),
            pricing=pricing_obj,
            listed_price_inr=float(self.listed_price_inr),
            stock_quantity=int(self.stock_quantity),
            lead_time_days=int(self.lead_time_days),
            is_customizable=bool(self.is_customizable),
            images=self.images or [],
            dimensions=dims,
            tags=self.tags or [],
            status=status_enum,
            views_count=int(self.views_count or 0),
            orders_count=int(self.orders_count or 0),
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
