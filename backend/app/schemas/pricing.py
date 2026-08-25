from typing import Dict, Optional
from pydantic import BaseModel, Field


class PricingInputs(BaseModel):
    material_cost_inr: float = Field(..., ge=0, description="Cost of raw materials per unit or total batch in INR")
    labour_daily_rate_inr: float = Field(..., ge=0, description="Daily wage per craftsman in INR")
    workers_count: int = Field(default=1, ge=1, description="Number of active craftsmen on this item")
    daily_capacity_units: float = Field(default=1.0, gt=0, description="Units crafted per day")
    production_days: float = Field(default=1.0, gt=0, description="Days taken per batch/unit")
    packaging_cost_inr: float = Field(default=20.0, ge=0, description="Packaging & handling cost per unit")
    energy_cost_inr: float = Field(default=0.0, ge=0, description="Kiln / electricity / fuel cost per unit or daily in INR")
    other_direct_cost_inr: float = Field(default=0.0, ge=0, description="Other direct workshop overhead per unit in INR")
    workshop_rent_daily_inr: Optional[float] = Field(default=0.0, ge=0, description="Workshop rent per day in INR")
    transport_batch_cost_inr: Optional[float] = Field(default=0.0, ge=0, description="Transportation cost per batch in INR")
    batch_total_units: Optional[float] = Field(default=None, gt=0, description="Explicit total units in batch (defaults to daily_capacity * production_days)")
    is_batch_material_total: bool = Field(default=False, description="Whether material_cost_inr is for the entire batch rather than per single unit")
    is_daily_energy_cost: bool = Field(default=False, description="Whether energy_cost_inr is per day rather than per unit")
    material_breakdown: Optional[Dict[str, float]] = Field(default=None, description="Itemized raw material breakdown (name: cost)")
    target_margin_percent: float = Field(default=25.0, ge=0.0, le=1000.0, description="Target profit margin percentage (e.g. 25%)")
    seller_minimum_acceptable_price_inr: Optional[float] = Field(default=None, ge=0, description="Seller non-negotiable minimum price floor")
    market_reference_price_inr: Optional[float] = Field(default=None, ge=0, description="Optional comparable market price")


class PricingBreakdown(BaseModel):
    unit_material_cost_inr: float = 0.0
    unit_labour_cost_inr: float
    unit_overhead_cost_inr: float = 0.0
    unit_direct_cost_inr: float
    total_unit_cost_inr: float
    minimum_floor_price_inr: float
    recommended_price_inr: float
    premium_market_price_inr: float
    profit_per_unit_inr: float
    target_margin_percent: float
    formula_explanation: str
