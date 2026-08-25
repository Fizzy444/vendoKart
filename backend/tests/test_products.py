import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.services.pricing_engine import DeterministicPricingEngine, PricingInputs


def test_deterministic_pricing_engine():
    # 2 workers, ₹400 daily wage, 5 units daily capacity
    # Unit Labour Cost = (2 * 400) / 5 = ₹160
    # Material = ₹200, Packaging = ₹20, Energy = ₹10
    # Total Unit Cost = 160 + 200 + 20 + 10 = ₹390
    # Target Margin = 25% -> Recommended = ceil(390 * 1.25) = ₹488
    # Floor (10% min margin) = ceil(390 * 1.10) = ₹430
    inputs = PricingInputs(
        material_cost_inr=200.0,
        labour_daily_rate_inr=400.0,
        workers_count=2,
        daily_capacity_units=5.0,
        production_days=1.0,
        packaging_cost_inr=20.0,
        energy_cost_inr=10.0,
        other_direct_cost_inr=0.0,
        target_margin_percent=25.0,
    )
    res = DeterministicPricingEngine.calculate_pricing(inputs)
    assert res.unit_labour_cost_inr == 160.0
    assert res.total_unit_cost_inr == 390.0
    assert res.minimum_floor_price_inr == 430.0
    assert res.recommended_price_inr == 488.0
    assert res.profit_per_unit_inr == 98.0


@pytest.mark.asyncio
async def test_product_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Dev Login as seller
        login_res = await ac.post("/api/v1/auth/dev-login", json={"role": "seller"})
        assert login_res.status_code == 200
        token = login_res.json()["tokens"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test Pricing Preview Endpoint
        preview_payload = {
            "material_cost_inr": 150.0,
            "labour_daily_rate_inr": 450.0,
            "workers_count": 1,
            "daily_capacity_units": 3.0,
            "production_days": 1.0,
            "packaging_cost_inr": 25.0,
            "energy_cost_inr": 0.0,
            "other_direct_cost_inr": 0.0,
            "target_margin_percent": 30.0,
        }
        prev_res = await ac.post("/api/v1/products/pricing-preview", json=preview_payload)
        assert prev_res.status_code == 200
        pricing = prev_res.json()["pricing"]
        assert pricing["unit_labour_cost_inr"] == 150.0  # 450 / 3
        assert pricing["total_unit_cost_inr"] == 325.0  # 150 + 150 + 25

        # 3. Create Product
        prod_payload = {
            "title": "Handmade Bamboo Table Lamp",
            "description": "Artisan woven natural bamboo lamp shade with ambient warm glow.",
            "craft_category": "Bamboo Craft",
            "craft_specialty": "Lamps & Lighting",
            "material_type": "Treated Natural Bamboo",
            "material_cost_inr": 150.0,
            "labour_daily_rate_inr": 450.0,
            "workers_count": 1,
            "daily_capacity_units": 3.0,
            "production_days": 1.0,
            "packaging_cost_inr": 25.0,
            "target_margin_percent": 30.0,
            "stock_quantity": 8,
            "lead_time_days": 2,
            "images": ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"],
            "tags": ["bamboo", "lamp", "eco-friendly", "handmade"],
        }
        create_res = await ac.post("/api/v1/products", json=prod_payload, headers=headers)
        assert create_res.status_code == 201
        created = create_res.json()
        assert created["title"] == "Handmade Bamboo Table Lamp"
        assert created["listed_price_inr"] == pricing["recommended_price_inr"]
        prod_id = created["id"]

        # 4. Get My Products List
        my_prods_res = await ac.get("/api/v1/products/me", headers=headers)
        assert my_prods_res.status_code == 200
        prods = my_prods_res.json()
        assert len(prods) >= 1
        assert any(p["id"] == prod_id for p in prods)

        # 5. Marketplace Public Discovery
        market_res = await ac.get("/api/v1/products/marketplace")
        assert market_res.status_code == 200
        market_prods = market_res.json()
        assert any(p["id"] == prod_id for p in market_prods)

        # 6. Delete Product
        del_res = await ac.delete(f"/api/v1/products/{prod_id}", headers=headers)
        assert del_res.status_code == 200
