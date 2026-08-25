import json
import os
import sys
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Ensure root is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ai.client import MODEL_MARKET_INFO, get_groq_client


class MarketPriceBenchmark(BaseModel):
    product_name: str
    category: str
    market_low_inr: float
    market_median_inr: float
    market_high_inr: float
    demand_level: str = Field(..., description="'HIGH', 'MODERATE', 'NICHE'")
    popular_buyer_tags: List[str]
    market_analysis_summary: str


class MarketIntelligenceService:
    """
    Market Information Service (§10, §11).
    Role: groq/compound (Built-in web search & tool synthesis).
    Retrieves and summarizes realistic market price benchmarks and demand patterns.
    """

    def __init__(self, model_name: str = MODEL_MARKET_INFO):
        self.model_name = model_name
        self.client = get_groq_client(role="market")

    def get_market_benchmark(
        self,
        product_name: str,
        category: str,
        material_type: str = "Natural eco-friendly materials"
    ) -> MarketPriceBenchmark:
        system_prompt = (
            "You are the Indian Artisan Market Intelligence Expert for VendoKart.\n"
            "Analyze current e-commerce and fair-trade market prices (INR) for handcrafted products.\n"
            "Return strictly valid JSON conforming to the requested benchmark schema."
        )

        user_prompt = (
            f"Analyze market pricing and demand for:\n"
            f"Product: {product_name}\n"
            f"Category: {category}\n"
            f"Material: {material_type}\n\n"
            "Output JSON with keys:\n"
            "- market_low_inr (float)\n"
            "- market_median_inr (float)\n"
            "- market_high_inr (float)\n"
            "- demand_level (one of 'HIGH', 'MODERATE', 'NICHE')\n"
            "- popular_buyer_tags (array of 3-5 strings)\n"
            "- market_analysis_summary (string, 2 sentences on market landscape)"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            raw = json.loads(response.choices[0].message.content or "{}")

            return MarketPriceBenchmark(
                product_name=product_name,
                category=category,
                market_low_inr=float(raw.get("market_low_inr", 450.0)),
                market_median_inr=float(raw.get("market_median_inr", 650.0)),
                market_high_inr=float(raw.get("market_high_inr", 950.0)),
                demand_level=raw.get("demand_level", "MODERATE"),
                popular_buyer_tags=raw.get("popular_buyer_tags", ["handmade", "sustainable", "artisan-crafted"]),
                market_analysis_summary=raw.get("market_analysis_summary", "Healthy demand across urban and corporate gift sectors.")
            )
        except Exception:
            # Deterministic fallback benchmark
            return MarketPriceBenchmark(
                product_name=product_name,
                category=category,
                market_low_inr=450.0,
                market_median_inr=520.0,
                market_high_inr=550.0,
                demand_level="HIGH",
                popular_buyer_tags=["eco-friendly", "handmade", "home-decor", "natural-fiber"],
                market_analysis_summary="Consistent year-round demand for authentic handmade storage and utility baskets."
            )
