from typing import List, Optional
from pydantic import BaseModel, Field


class RequirementExtraction(BaseModel):
    query: Optional[str] = Field(default=None, description="Raw query string")
    product: Optional[str] = Field(default=None, description="Extracted product keyword")
    category: Optional[str] = Field(default=None, description="Extracted product category")
    quantity: Optional[int] = Field(default=None, description="Extracted target quantity")
    max_budget: Optional[float] = Field(default=None, description="Extracted maximum total budget")
    budget_type: Optional[str] = Field(default="total", description="Budget type: total or per_unit")
    deadline_days: Optional[int] = Field(default=None, description="Extracted delivery deadline in days")
    max_delivery_days: Optional[int] = Field(default=None, description="Extracted delivery deadline in days (alias for deadline_days)")
    material: Optional[str] = Field(default=None, description="Extracted craft material")
    craft_material: Optional[str] = Field(default=None, description="Extracted craft material (alias)")
    location: Optional[str] = Field(default=None, description="Extracted target location")
    other_requirements: List[str] = Field(default_factory=list, description="Other requirements extracted")


class ProductItem(BaseModel):
    id: str
    name: str
    artisan_name: str
    is_verified_artisan: bool = True
    location: str
    category: str
    price: float
    price_per_unit: Optional[float] = None
    min_order_qty: int = 1
    delivery_days: int = 3
    production_capacity_per_day: int = 20
    shipping_days: int = 1
    lead_time_days: int = 0
    image_url: str
    description: str
    craft_type: str
    rating: float = 4.8
    stock: int = 100
    is_favorite: bool = False


class SearchRequest(BaseModel):
    query: Optional[str] = None
    ai_mode: bool = True
    price_range: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    quantity_range: Optional[str] = None
    min_qty: Optional[int] = None
    max_qty: Optional[int] = None
    category: Optional[str] = None
    location_mode: Optional[str] = None  # "all", "nearby", "custom"
    user_location: Optional[str] = None  # User's saved location string
    sort_by: str = "relevance"  # "relevance", "price_asc", "price_desc", "rating", "nearest", "delivery_time"


class SearchResponse(BaseModel):
    query: Optional[str] = None
    ai_mode: bool = True
    extracted_requirements: Optional[RequirementExtraction] = None
    total_results: int
    products: List[ProductItem]
