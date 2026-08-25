from typing import Optional
from pydantic import BaseModel, Field


class PricingInputs(BaseModel):
    material_cost_inr: float = Field(..., ge=0, description="Cost of raw materials per unit in INR")
    labour_daily_rate_inr: float = Field(..., ge=0, description="Daily wage per craftsman in INR")
    workers_count: int = Field(default=1, ge=1, description="Number of active craftsmen on this item")
    daily_capacity_units: float = Field(default=1.0, gt=0, description="Units crafted per day")
    production_days: float = Field(default=1.0, gt=0, description="Days taken per batch/unit")
    packaging_cost_inr: float = Field(default=20.0, ge=0, description="Packaging & handling cost per unit")
    energy_cost_inr: float = Field(default=0.0, ge=0, description="Kiln / electricity / fuel cost per unit")
    other_direct_cost_inr: float = Field(default=0.0, ge=0, description="Other direct workshop overhead per unit")
    target_margin_percent: float = Field(default=25.0, ge=5.0, le=100.0, description="Target profit margin percentage (e.g. 25%)")
    market_reference_price_inr: Optional[float] = Field(default=None, ge=0, description="Optional comparable market price")


class PricingBreakdown(BaseModel):
    unit_labour_cost_inr: float
    unit_direct_cost_inr: float
    total_unit_cost_inr: float
    minimum_floor_price_inr: float
    recommended_price_inr: float
    premium_market_price_inr: float
    profit_per_unit_inr: float
    target_margin_percent: float
    formula_explanation: str
