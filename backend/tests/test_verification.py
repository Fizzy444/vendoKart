import pytest
from httpx import AsyncClient
from app.services.trust_service import TrustService


def test_perceptual_dhash_calculation():
    """Test that perceptual dHash produces valid hexadecimal hashes and distances."""
    sample_img_uri = (
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8"
        "z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"
    )
    dhash1 = TrustService.compute_dhash(sample_img_uri)
    assert isinstance(dhash1, str)
    assert len(dhash1) > 0

    dist = TrustService.hamming_distance(dhash1, dhash1)
    assert dist == 0


@pytest.mark.asyncio
async def test_live_camera_evidence_verification(async_client: AsyncClient):
    """Test full presence verification lifecycle and trust score progression."""
    # 1. Login as dev seller
    seller_phone = "+919876543299"
    login_resp = await async_client.post(
        "/api/v1/auth/dev-login",
        json={"role": "seller", "name": "Arjun Master Weaver", "phone": seller_phone},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup initial seller profile
    await async_client.put(
        "/api/v1/sellers/me",
        headers=headers,
        json={
            "business_name": "Arjun Handloom Weaves",
            "craft_category": "Handloom & Textiles",
            "seller_type": "independent_artisan",
            "workspace_type": "home_workshop",
            "daily_capacity_units": 6.0,
            "daily_labour_rate_inr": 500.0,
            "number_of_workers": 1,
            "is_onboarded": True,
            "location": {
                "street": "Weaver Street",
                "city": "Coimbatore",
                "district": "Coimbatore",
                "state": "Tamil Nadu",
                "pincode": "641001",
                "latitude": 11.0168,
                "longitude": 76.9558,
            },
        },
    )

    # 3. Check initial trust status (Phone + Location + Profile = ~65 pts)
    status_resp = await async_client.get("/api/v1/verification/status", headers=headers)
    assert status_resp.status_code == 200
    initial_signals = status_resp.json()
    assert initial_signals["phone_otp_verified"] is True
    assert initial_signals["location_verified"] is True
    assert initial_signals["total_trust_score"] >= 50

    # 4. Submit 3-photo live camera evidence
    sample_img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"
    submit_resp = await async_client.post(
        "/api/v1/verification/submit-live-evidence",
        headers=headers,
        json={
            "workspace_photo": sample_img,
            "process_photo": sample_img,
            "finished_product_photo": sample_img,
            "latitude": 11.0168,
            "longitude": 76.9558,
        },
    )
    assert submit_resp.status_code == 201
    result = submit_resp.json()
    assert result["trust_score"] >= 80
    assert result["verification_status"] == "verified"
    assert result["risk_tier"] == "low"
