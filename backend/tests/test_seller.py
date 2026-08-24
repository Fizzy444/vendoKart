import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_seller_profile_lifecycle(async_client: AsyncClient):
    # 1. Log in as dev seller
    login_resp = await async_client.post(
        "/api/v1/auth/dev-login",
        json={"role": "seller", "name": "Meena Devi", "phone": "+919876543299"},
    )
    assert login_resp.status_code == 200
    auth_data = login_resp.json()
    token = auth_data["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get initial seller profile (auto-created)
    get_profile_resp = await async_client.get("/api/v1/sellers/me", headers=headers)
    assert get_profile_resp.status_code == 200
    profile = get_profile_resp.json()
    assert profile["phone"] == "+919876543299"
    assert profile["artisan_name"] == "Meena Devi"
    assert profile["is_onboarded"] is False
    seller_id = profile["id"]

    # 3. Update seller profile with craft, capacity, and labour details
    update_payload = {
        "artisan_name": "Meena Devi",
        "business_name": "Meena Bamboo Crafts",
        "bio": "Handcrafting sustainable bamboo homeware and storage baskets since 2012.",
        "craft_category": "Bamboo Craft",
        "craft_specialties": ["Storage Baskets", "Floor Mats", "Planters"],
        "experience_years": 12,
        "seller_type": "individual_artisan",
        "workspace_type": "home_workshop",
        "number_of_workers": 2,
        "daily_labour_rate_inr": 450.0,
        "daily_capacity_units": 15,
        "lead_time_days": 2,
        "is_onboarded": True,
    }
    update_resp = await async_client.put(
        "/api/v1/sellers/me",
        json=update_payload,
        headers=headers,
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["business_name"] == "Meena Bamboo Crafts"
    assert updated["craft_category"] == "Bamboo Craft"
    assert updated["number_of_workers"] == 2
    assert updated["daily_capacity_units"] == 15
    assert updated["daily_labour_rate_inr"] == 450.0
    assert updated["is_onboarded"] is True
    assert updated["trust_score"] >= 85.0

    # 4. Update GPS location
    loc_payload = {
        "latitude": 26.1445,
        "longitude": 91.7362,
        "address": "Craft Cluster Rd, Sector 4",
        "city": "Guwahati",
        "district": "Kamrup",
        "state": "Assam",
        "pincode": "781001",
    }
    loc_resp = await async_client.post(
        "/api/v1/sellers/me/location",
        json=loc_payload,
        headers=headers,
    )
    assert loc_resp.status_code == 200
    loc_data = loc_resp.json()
    assert loc_data["location"]["city"] == "Guwahati"
    assert loc_data["location"]["state"] == "Assam"
    assert loc_data["location"]["pincode"] == "781001"

    # 5. Public discovery
    public_resp = await async_client.get(f"/api/v1/sellers/{seller_id}")
    assert public_resp.status_code == 200
    pub = public_resp.json()
    assert pub["business_name"] == "Meena Bamboo Crafts"
    assert pub["city"] == "Guwahati"
    assert pub["craft_category"] == "Bamboo Craft"

    # 6. List public sellers
    list_resp = await async_client.get("/api/v1/sellers/")
    assert list_resp.status_code == 200
    sellers_list = list_resp.json()
    assert len(sellers_list) >= 1
    assert any(s["id"] == seller_id for s in sellers_list)


@pytest.mark.asyncio
async def test_seller_endpoint_role_protection(async_client: AsyncClient):
    # Log in as Buyer
    buyer_login = await async_client.post(
        "/api/v1/auth/dev-login",
        json={"role": "buyer", "name": "Buyer Customer", "phone": "+919876543298"},
    )
    assert buyer_login.status_code == 200
    buyer_token = buyer_login.json()["tokens"]["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Attempt to access seller profile route with buyer credentials
    forbidden_resp = await async_client.get("/api/v1/sellers/me", headers=buyer_headers)
    assert forbidden_resp.status_code == 403
