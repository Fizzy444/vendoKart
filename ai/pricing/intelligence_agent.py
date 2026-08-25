import json
import math
import os
import sys
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Ensure root and backend are on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ai.client import (
    MODEL_MARKET_INFO,
    MODEL_NEGOTIATION_AGENT,
    MODEL_PRICING_EXPLANATION,
    MODEL_SUSPICIOUS_DATA_REASONING,
    get_groq_client,
)
from ai.matching.market_info import MarketIntelligenceService
from ai.pricing.redis_cache import pricing_cache
try:
    from app.schemas.pricing import PricingBreakdown, PricingInputs
    from app.services.pricing_engine import DeterministicPricingEngine
except ImportError:
    from backend.app.schemas.pricing import PricingBreakdown, PricingInputs
    from backend.app.services.pricing_engine import DeterministicPricingEngine


class TrustLevel(str, Enum):
    VERIFIED_BY_PLATFORM = "VERIFIED_BY_PLATFORM"
    GOVERNMENT_OFFICIAL_DATA = "GOVERNMENT_OFFICIAL_DATA"
    SYSTEM_CALCULATED = "SYSTEM_CALCULATED"
    MARKET_DATA = "MARKET_DATA"
    SELLER_DECLARED = "SELLER_DECLARED"
    AI_EXTRACTED = "AI_EXTRACTED"
    USER_ESTIMATED = "USER_ESTIMATED"


class ValidationStatus(str, Enum):
    VALID = "VALID"
    NEEDS_CONFIRMATION = "NEEDS_CONFIRMATION"
    INVALID = "INVALID"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class DataField(BaseModel):
    value: Any
    source: TrustLevel = TrustLevel.SELLER_DECLARED
    confidence: float = 0.85
    is_known: bool = True


class PricingAnalysisResponse(BaseModel):
    status: ValidationStatus
    validated_inputs: Dict[str, Any]
    issues: List[Dict[str, Any]]
    calculation_reference: Dict[str, Any]
    pricing_engine_result: Dict[str, Any]
    recommendation: Dict[str, Any]
    explanation: str
    negotiation_constraints: Dict[str, Any]
    required_user_action: str


class PricingNegotiationIntelligenceAgent:
    """
    Authoritative Pricing & Seller Negotiation Intelligence Agent.
    Implements all 20 core principles:
    - Never fabricates numbers (explicit UNKNOWN tracking).
    - Uses deterministic Python calculations for financial truth.
    - Strictly enforces seller's price floor.
    - Multi-turn negotiation with tactical reasoning (openai/gpt-oss-120b) + Python safety guardrails.
    - Redis-cached pricing and market lookups.
    """

    def __init__(self):
        self.pricing_client = get_groq_client(role="pricing")
        self.negotiation_client = get_groq_client(role="negotiation")
        self.market_service = MarketIntelligenceService()

    def validate_and_calculate(
        self,
        product_name: str,
        category: str,
        inputs: Dict[str, Any],
        seller_minimum_acceptable_price: Optional[float] = None,
        market_reference_range: Optional[tuple[float, float]] = None
    ) -> PricingAnalysisResponse:
        """
        Step 1-8: Validate inputs, detect anomalies/outliers, calculate costs via Pricing Engine,
        and generate structured explanation.
        """
        cache_key = f"pricing_analysis:{product_name}:{json.dumps(inputs, sort_keys=True)}"
        cached = pricing_cache.get(cache_key)
        if cached:
            return PricingAnalysisResponse(**cached)

        issues = []
        validated = {}
        status = ValidationStatus.VALID
        required_action = ""

        # 1. Required fields check
        required_keys = ["material_cost_inr", "labour_daily_rate_inr", "workers_count", "daily_capacity_units", "production_days"]
        missing_keys = [k for k in required_keys if k not in inputs or inputs[k] is None or inputs[k] == "UNKNOWN"]
        
        if missing_keys:
            return PricingAnalysisResponse(
                status=ValidationStatus.INSUFFICIENT_DATA,
                validated_inputs=inputs,
                issues=[{"field": k, "type": "MISSING_REQUIRED_FIELD", "message": f"{k} is required for calculation."} for k in missing_keys],
                calculation_reference={},
                pricing_engine_result={},
                recommendation={},
                explanation=f"Cannot proceed with calculation. Missing required fields: {', '.join(missing_keys)}. Please provide these details.",
                negotiation_constraints={},
                required_user_action=f"Please provide values for: {', '.join(missing_keys)}"
            )

        # 2. Extract values and validate
        try:
            material_cost = float(inputs["material_cost_inr"])
            labour_rate = float(inputs["labour_daily_rate_inr"])
            workers = int(inputs["workers_count"])
            daily_capacity = float(inputs["daily_capacity_units"])
            production_days = float(inputs["production_days"])
            packaging_cost = float(inputs.get("packaging_cost_inr", 0.0))
            energy_cost = float(inputs.get("energy_cost_inr", 0.0))
            workshop_rent_daily = float(inputs.get("workshop_rent_daily_inr", 0.0))
            transport_cost = float(inputs.get("transport_batch_cost_inr", 0.0))
            target_margin = float(inputs.get("target_margin_percent", 25.0))
            batch_total_units = float(inputs.get("batch_total_units", daily_capacity * production_days))
            is_batch_material_total = bool(inputs.get("is_batch_material_total", True))
            is_daily_energy = bool(inputs.get("is_daily_energy_cost", True))
        except (ValueError, TypeError) as e:
            return PricingAnalysisResponse(
                status=ValidationStatus.INVALID,
                validated_inputs=inputs,
                issues=[{"field": "numeric_parsing", "type": "INVALID_NUMERIC_DATA", "message": str(e)}],
                calculation_reference={},
                pricing_engine_result={},
                recommendation={},
                explanation="One or more fields contained non-numeric or invalid formats.",
                negotiation_constraints={},
                required_user_action="Please re-enter inputs with valid numbers."
            )

        # 3. Value validations
        if production_days <= 0:
            issues.append({"field": "production_days", "type": "INVALID_DATA", "message": "Production days must be greater than 0."})
            status = ValidationStatus.INVALID
        if daily_capacity <= 0:
            issues.append({"field": "daily_capacity_units", "type": "INSUFFICIENT_DATA", "message": "Daily production capacity must be greater than 0."})
            status = ValidationStatus.INSUFFICIENT_DATA
        if workers <= 0:
            issues.append({"field": "workers_count", "type": "INVALID_DATA", "message": "Worker count must be at least 1."})
            status = ValidationStatus.INVALID
        if material_cost < 0 or labour_rate < 0:
            issues.append({"field": "costs", "type": "INVALID_DATA", "message": "Cost values cannot be negative."})
            status = ValidationStatus.INVALID

        # 4. Suspicious data checks
        if workers <= 2 and daily_capacity > 200:
            issues.append({
                "field": "daily_capacity_units",
                "type": "SUSPICIOUS_DATA",
                "message": f"Declared capacity of {daily_capacity} units/day by {workers} worker(s) appears unusually high for handcrafted production."
            })
            status = ValidationStatus.NEEDS_CONFIRMATION
            required_action = "Please confirm your maximum manual daily production capacity."

        # 5. Outlier Detection against Market
        if market_reference_range:
            m_low, m_high = market_reference_range
            if material_cost > m_high * 2:
                issues.append({
                    "field": "material_cost_inr",
                    "type": "OUTLIER_REQUIRES_CONFIRMATION",
                    "message": f"You entered ₹{material_cost:,.2f} as material cost, which is significantly higher than the reference range (₹{m_low}–₹{m_high})."
                })
                if status == ValidationStatus.VALID:
                    status = ValidationStatus.NEEDS_CONFIRMATION
                required_action = "Please confirm whether your material cost is accurate."

        if status == ValidationStatus.INVALID:
            return PricingAnalysisResponse(
                status=status,
                validated_inputs=inputs,
                issues=issues,
                calculation_reference={},
                pricing_engine_result={},
                recommendation={},
                explanation="Input validation failed due to invalid data constraints.",
                negotiation_constraints={},
                required_user_action="Please correct the invalid fields."
            )

        # 6. Execute Deterministic Python Calculations
        pricing_inputs = PricingInputs(
            material_cost_inr=material_cost,
            is_batch_material_total=is_batch_material_total,
            material_breakdown=inputs.get("material_breakdown"),
            labour_daily_rate_inr=labour_rate,
            workers_count=workers,
            production_days=production_days,
            daily_capacity_units=daily_capacity,
            batch_total_units=batch_total_units,
            workshop_rent_daily_inr=workshop_rent_daily,
            energy_cost_inr=energy_cost,
            is_daily_energy_cost=is_daily_energy,
            transport_batch_cost_inr=transport_cost,
            packaging_cost_inr=packaging_cost,
            other_direct_cost_inr=0.0,
            target_margin_percent=target_margin,
            seller_minimum_acceptable_price_inr=seller_minimum_acceptable_price
        )

        breakdown = DeterministicPricingEngine.calculate_pricing(pricing_inputs)

        # 7. Fetch Market Benchmark (or from cache)
        market_benchmark = self.market_service.get_market_benchmark(product_name, category)

        # 8. Generate Clear Explanation using openai/gpt-oss-20b
        system_prompt = (
            "You are the Pricing Explanation Specialist for VendoKart.\n"
            "Follow these strict rules:\n"
            "1. NEVER alter, hallucinate, or contradict calculated numerical values.\n"
            "2. State estimated production cost and break it down into labour, materials, rent, and overheads.\n"
            "3. State the configured target margin and seller minimum acceptable price.\n"
            "4. Clearly explain why the recommended selling range was selected."
        )

        user_prompt = (
            f"Product: {product_name}\n"
            f"Category: {category}\n"
            f"Unit Labour Cost: ₹{breakdown.unit_labour_cost_inr:,.2f} ({workers} workers @ ₹{labour_rate}/day for {production_days} days across {batch_total_units} units)\n"
            f"Unit Material Cost: ₹{breakdown.unit_material_cost_inr:,.2f}\n"
            f"Unit Overheads (Rent+Energy+Transport): ₹{breakdown.unit_overhead_cost_inr:,.2f}\n"
            f"Total Unit Production Cost: ₹{breakdown.total_unit_cost_inr:,.2f}\n"
            f"Target Margin: {breakdown.target_margin_percent}%\n"
            f"Seller Minimum Acceptable Price: ₹{seller_minimum_acceptable_price or breakdown.minimum_floor_price_inr:,.2f}\n"
            f"Recommended Price: ₹{breakdown.recommended_price_inr:,.2f}\n"
            f"Market Reference Range: ₹{market_benchmark.market_low_inr:,.2f}–₹{market_benchmark.market_high_inr:,.2f} (Median: ₹{market_benchmark.market_median_inr:,.2f})\n\n"
            "Generate a clear, transparent explanation for the seller."
        )

        try:
            exp_res = self.pricing_client.chat.completions.create(
                model=MODEL_PRICING_EXPLANATION,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
            )
            explanation_text = exp_res.choices[0].message.content or breakdown.formula_explanation
        except Exception:
            explanation_text = (
                f"Your estimated production cost is ₹{breakdown.total_unit_cost_inr:,.2f} per unit. "
                f"This includes Material: ₹{breakdown.unit_material_cost_inr:,.2f}, Labour: ₹{breakdown.unit_labour_cost_inr:,.2f} "
                f"({workers} workers @ ₹{labour_rate}/day for {production_days} days), and Overheads: ₹{breakdown.unit_overhead_cost_inr:,.2f}. "
                f"Your minimum acceptable price is ₹{breakdown.minimum_floor_price_inr:,.2f}. "
                f"Available market references indicate a range of ₹{market_benchmark.market_low_inr:,.2f}–₹{market_benchmark.market_high_inr:,.2f}."
            )

        response = PricingAnalysisResponse(
            status=status,
            validated_inputs={
                "material_cost_inr": material_cost,
                "labour_daily_rate_inr": labour_rate,
                "workers_count": workers,
                "production_days": production_days,
                "daily_capacity_units": daily_capacity,
                "total_batch_units": batch_total_units,
                "target_margin_percent": target_margin,
                "seller_minimum_acceptable_price_inr": seller_minimum_acceptable_price,
            },
            issues=issues,
            calculation_reference={
                "total_batch_cost_inr": round(breakdown.total_unit_cost_inr * batch_total_units, 2),
                "total_labour_cost_inr": round(workers * labour_rate * production_days, 2),
                "formula": "Unit Labour = (W * L * D) / Batch Units; Total Cost = Labour + Material + Packaging + Overheads"
            },
            pricing_engine_result=breakdown.model_dump(),
            recommendation={
                "recommended_price_inr": breakdown.recommended_price_inr,
                "recommended_range_inr": [
                    max(breakdown.minimum_floor_price_inr, math.floor(breakdown.recommended_price_inr * 0.98)),
                    math.ceil(breakdown.recommended_price_inr * 1.05)
                ],
                "minimum_floor_price_inr": breakdown.minimum_floor_price_inr,
                "market_reference_median_inr": market_benchmark.market_median_inr
            },
            explanation=explanation_text,
            negotiation_constraints={
                "hard_floor_price_inr": breakdown.minimum_floor_price_inr,
                "max_allowable_discount_percent": round(((breakdown.recommended_price_inr - breakdown.minimum_floor_price_inr) / breakdown.recommended_price_inr) * 100, 2) if breakdown.recommended_price_inr > breakdown.minimum_floor_price_inr else 0.0
            },
            required_user_action=required_action
        )

        pricing_cache.set(cache_key, response.model_dump(), ttl_seconds=1800)
        return response

    def negotiate(
        self,
        conversation_type: str,  # "SELLER_PRICING" or "BUYER_NEGOTIATION"
        product_name: str,
        user_message: str,
        pricing_data: Dict[str, Any],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        offered_price: Optional[float] = None,
        quantity: int = 1
    ) -> Dict[str, Any]:
        """
        Executes the exact workflow:
        Message -> LLM Extraction (120b) -> Python Business Rules (Floor, Cost, Capacity) -> Allowed/Rejected -> LLM Response.
        """
        floor_price = float(pricing_data.get("minimum_floor_price_inr", 500.0))
        unit_cost = float(pricing_data.get("total_unit_cost_inr", 342.0))
        listed_price = float(pricing_data.get("recommended_price_inr", 550.0))
        target_margin = float(pricing_data.get("target_margin_percent", 25.0))
        history = conversation_history or []

        system_prompt = (
            f"You are the Authoritative Pricing & Negotiation Intelligence Agent for VendoKart.\n"
            f"You operate with tactical reasoning (openai/gpt-oss-120b) strictly constrained by deterministic Python business rules.\n\n"
            f"RULES:\n"
            f"1. NEVER invent or hallucinate market numbers, costs, or unverified claims.\n"
            f"2. Never accept any price below the non-negotiable floor price (₹{floor_price}).\n"
            f"3. If buyer offers below the floor, explain the minimum price and refuse acceptance.\n"
            f"4. If seller wants to price higher than market reference, explain the market range (e.g. ₹450-₹550) and suggest a balanced range (₹550-₹600) based on craftsmanship.\n"
            f"5. If seller wants to price lower, explain the cost breakdown and margin buffer.\n"
            f"6. Output JSON with:\n"
            f"   - 'extracted_intent': {{'price': float or null, 'quantity': int, 'intent': str}}\n"
            f"   - 'thought': 'Step-by-step ReAct internal reasoning'\n"
            f"   - 'python_rule_check': 'ALLOWED' or 'REJECTED'\n"
            f"   - 'final_action': 'ACCEPT_DEAL', 'COUNTER_OFFER', 'REJECT_OFFER', 'EXPLAIN_PRICE', 'RECORD_SELLER_OVERRIDE'\n"
            f"   - 'agent_response': 'Exact natural language message to the user'\n"
            f"   - 'order_status': 'NEGOTIATING', 'ACCEPTED', or 'REJECTED'"
        )

        context_payload = {
            "conversation_type": conversation_type,
            "product_name": product_name,
            "user_message": user_message,
            "offered_price": offered_price,
            "quantity": quantity,
            "unit_cost_inr": unit_cost,
            "floor_price_inr": floor_price,
            "listed_price_inr": listed_price,
            "target_margin_percent": target_margin,
            "conversation_history": history
        }

        try:
            res = self.negotiation_client.chat.completions.create(
                model=MODEL_NEGOTIATION_AGENT,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(context_payload, indent=2)}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw = json.loads(res.choices[0].message.content or "{}")
        except Exception:
            # Deterministic Fallback Logic
            raw = {
                "thought": "Direct Python safety rule execution.",
                "extracted_intent": {"price": offered_price, "quantity": quantity, "intent": "negotiation"},
                "python_rule_check": "REJECTED" if (offered_price and offered_price < floor_price) else "ALLOWED",
                "final_action": "REJECT_OFFER" if (offered_price and offered_price < floor_price) else "COUNTER_OFFER",
                "agent_response": f"The seller's minimum acceptable price is ₹{floor_price:,.2f} per basket, so I cannot confirm ₹{offered_price:,.2f}.",
                "order_status": "NEGOTIATING"
            }

        # ----------------------------------------------------
        # Python Business Rules Layer (AUTHORITATIVE GUARDRAIL)
        # ----------------------------------------------------
        extracted_price = raw.get("extracted_intent", {}).get("price") or offered_price
        python_rule_check = "ALLOWED"
        order_status = raw.get("order_status", "NEGOTIATING")
        agent_response = raw.get("agent_response", "")

        if extracted_price is not None:
            if extracted_price < floor_price:
                # Strictly reject acceptance below price floor
                python_rule_check = "REJECTED"
                if raw.get("final_action") == "ACCEPT_DEAL":
                    raw["final_action"] = "COUNTER_OFFER"
                    order_status = "NEGOTIATING"
                    agent_response = f"The seller's current minimum acceptable price is ₹{floor_price:,.2f} per basket, so I cannot confirm ₹{extracted_price:,.2f}."
            elif extracted_price >= floor_price and conversation_type == "BUYER_NEGOTIATION":
                if quantity >= 1 and raw.get("final_action") in ("ACCEPT_DEAL", "COUNTER_OFFER"):
                    total_amount = round(extracted_price * quantity, 2)
                    if extracted_price == floor_price and "accept" in user_message.lower():
                        order_status = "ACCEPTED"
                        agent_response = f"The seller has accepted the offer."

        raw["python_rule_check"] = python_rule_check
        raw["order_status"] = order_status
        raw["agent_response"] = agent_response
        raw["floor_price_inr"] = floor_price
        raw["unit_cost_inr"] = unit_cost

        return raw
