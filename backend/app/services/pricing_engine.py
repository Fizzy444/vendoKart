import math
from typing import Any, Dict, Optional
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


class DeterministicPricingEngine:
    """
    Deterministic Fair Pricing Engine (§11).
    Pure mathematical calculations ensuring non-negotiable artisan floor prices
    and transparent cost breakdowns without hallucinating LLM numbers.
    """

    @classmethod
    def calculate_pricing(cls, inputs: PricingInputs) -> PricingBreakdown:
        # 1. Unit Labour Cost (§11): (W * L) / U
        # Total Labour Cost = W * L * D, Total Production = U * D -> Labour/Unit = (W * L) / U
        unit_labour_cost = (inputs.workers_count * inputs.labour_daily_rate_inr) / inputs.daily_capacity_units
        unit_labour_cost = round(unit_labour_cost, 2)

        # 2. Direct Overhead Costs
        unit_direct_cost = (
            inputs.material_cost_inr
            + inputs.packaging_cost_inr
            + inputs.energy_cost_inr
            + inputs.other_direct_cost_inr
        )
        unit_direct_cost = round(unit_direct_cost, 2)

        # 3. Total Unit Production Cost
        total_unit_cost = round(unit_labour_cost + unit_direct_cost, 2)

        # 4. Minimum Floor Price (§11: Unit Cost * (1 + 10% bare minimum safety margin))
        minimum_floor_price = math.ceil(total_unit_cost * 1.10)

        # 5. Base Recommended Price (Unit Cost * (1 + Target Margin%))
        margin_multiplier = 1.0 + (inputs.target_margin_percent / 100.0)
        recommended_price = math.ceil(total_unit_cost * margin_multiplier)

        # 6. Premium Market Price (takes market reference into account if available)
        if inputs.market_reference_price_inr and inputs.market_reference_price_inr > recommended_price:
            premium_market_price = math.ceil(inputs.market_reference_price_inr * 1.05)
        else:
            premium_market_price = math.ceil(recommended_price * 1.20)

        # Profit per unit at recommended price
        profit_per_unit = round(recommended_price - total_unit_cost, 2)

        formula_explanation = (
            f"Unit Labour Cost = ({inputs.workers_count} workers × ₹{inputs.labour_daily_rate_inr}/day) / {inputs.daily_capacity_units} units/day = ₹{unit_labour_cost}. "
            f"Total Cost = Material (₹{inputs.material_cost_inr}) + Labour (₹{unit_labour_cost}) + Packaging (₹{inputs.packaging_cost_inr}) + Other (₹{inputs.energy_cost_inr + inputs.other_direct_cost_inr}) = ₹{total_unit_cost}. "
            f"At {inputs.target_margin_percent}% margin, Recommended Fair Price is ₹{recommended_price} (Guaranteed Floor: ₹{minimum_floor_price})."
        )

        return PricingBreakdown(
            unit_labour_cost_inr=unit_labour_cost,
            unit_direct_cost_inr=unit_direct_cost,
            total_unit_cost_inr=total_unit_cost,
            minimum_floor_price_inr=minimum_floor_price,
            recommended_price_inr=recommended_price,
            premium_market_price_inr=premium_market_price,
            profit_per_unit_inr=profit_per_unit,
            target_margin_percent=inputs.target_margin_percent,
            formula_explanation=formula_explanation,
        )
