import math
from typing import Any, Dict, Optional
from app.schemas.pricing import PricingBreakdown, PricingInputs


class DeterministicPricingEngine:
    """
    Deterministic Fair Pricing Engine (§11).
    Pure mathematical calculations ensuring non-negotiable artisan floor prices
    and transparent cost breakdowns without hallucinating LLM numbers.
    """

    @classmethod
    def calculate_pricing(cls, inputs: PricingInputs) -> PricingBreakdown:
        # Determine effective batch units
        production_days = max(inputs.production_days, 1.0)
        daily_capacity = max(inputs.daily_capacity_units, 0.001)
        
        if inputs.batch_total_units and inputs.batch_total_units > 0:
            batch_units = inputs.batch_total_units
        else:
            batch_units = daily_capacity * production_days

        # 1. Unit Labour Cost (§11): (W * L * D) / Batch Units
        total_labour_cost = inputs.workers_count * inputs.labour_daily_rate_inr * production_days
        unit_labour_cost = round(total_labour_cost / batch_units, 2)

        # 2. Material Cost per unit
        if inputs.is_batch_material_total:
            unit_material_cost = round(inputs.material_cost_inr / batch_units, 2)
        else:
            unit_material_cost = round(inputs.material_cost_inr, 2)

        # 3. Direct Overheads (Rent, Energy, Packaging, Transportation, Other)
        rent_per_unit = round(((inputs.workshop_rent_daily_inr or 0.0) * production_days) / batch_units, 2)
        
        if inputs.is_daily_energy_cost:
            energy_per_unit = round((inputs.energy_cost_inr * production_days) / batch_units, 2)
        else:
            energy_per_unit = round(inputs.energy_cost_inr, 2)
            
        transport_per_unit = round((inputs.transport_batch_cost_inr or 0.0) / batch_units, 2)
        packaging_per_unit = round(inputs.packaging_cost_inr, 2)
        other_per_unit = round(inputs.other_direct_cost_inr, 2)

        unit_overhead_cost = round(rent_per_unit + energy_per_unit + transport_per_unit + other_per_unit, 2)
        unit_direct_cost = round(unit_material_cost + packaging_per_unit + unit_overhead_cost, 2)

        # 4. Total Unit Production Cost
        total_unit_cost = round(unit_labour_cost + unit_direct_cost, 2)

        # 5. Guaranteed Minimum Floor Price (§11: Unit Cost * (1 + 10% bare minimum safety margin) or seller floor)
        mathematical_floor = math.ceil(total_unit_cost * 1.10)
        seller_floor = math.ceil(inputs.seller_minimum_acceptable_price_inr) if inputs.seller_minimum_acceptable_price_inr is not None else 0
        minimum_floor_price = max(mathematical_floor, seller_floor)

        # 6. Base Recommended Price (Unit Cost * (1 + Target Margin%))
        margin_multiplier = 1.0 + (inputs.target_margin_percent / 100.0)
        cost_plus_margin_price = math.ceil(total_unit_cost * margin_multiplier)
        recommended_price = max(cost_plus_margin_price, minimum_floor_price)

        # 7. Premium Market Price (takes market reference into account if available)
        if inputs.market_reference_price_inr and inputs.market_reference_price_inr > recommended_price:
            premium_market_price = math.ceil(inputs.market_reference_price_inr * 1.05)
        else:
            premium_market_price = math.ceil(recommended_price * 1.20)

        # Profit per unit at recommended price
        profit_per_unit = round(recommended_price - total_unit_cost, 2)

        formula_explanation = (
            f"Unit Labour Cost = ({inputs.workers_count} workers × ₹{inputs.labour_daily_rate_inr}/day × {production_days} days) / {batch_units} units = ₹{unit_labour_cost}. "
            f"Total Cost = Material (₹{unit_material_cost}) + Labour (₹{unit_labour_cost}) + Packaging (₹{packaging_per_unit}) + Overheads (₹{unit_overhead_cost}) = ₹{total_unit_cost}. "
            f"At {inputs.target_margin_percent}% target margin, Recommended Fair Price is ₹{recommended_price} (Guaranteed Floor: ₹{minimum_floor_price})."
        )

        return PricingBreakdown(
            unit_material_cost_inr=unit_material_cost,
            unit_labour_cost_inr=unit_labour_cost,
            unit_overhead_cost_inr=unit_overhead_cost,
            unit_direct_cost_inr=unit_direct_cost,
            total_unit_cost_inr=total_unit_cost,
            minimum_floor_price_inr=float(minimum_floor_price),
            recommended_price_inr=float(recommended_price),
            premium_market_price_inr=float(premium_market_price),
            profit_per_unit_inr=profit_per_unit,
            target_margin_percent=inputs.target_margin_percent,
            formula_explanation=formula_explanation,
        )
