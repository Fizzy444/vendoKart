import pytest
from httpx import AsyncClient
from app.services.otp_service import _in_memory_otp_cache


@pytest.mark.asyncio
async def test_otp_flow_and_authentication(async_client: AsyncClient):
    test_phone = "+919876543210"

    # 1. Request OTP
    send_resp = await async_client.post(
        "/api/v1/auth/otp/send",
        json={"phone": test_phone},
    )
    assert send_resp.status_code == 200
    send_data = send_resp.json()
    assert send_data["phone"] == test_phone
    assert "OTP sent successfully" in send_data["message"]

    # Retrieve the generated random OTP from cache for testing verification
    assert test_phone in _in_memory_otp_cache
    generated_otp, _ = _in_memory_otp_cache[test_phone]
    assert len(generated_otp) == 6

    # 2. Verify with wrong OTP
    bad_verify_resp = await async_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": test_phone, "otp": "000000", "role": "seller"},
    )
    assert bad_verify_resp.status_code == 400

    # 3. Verify with valid random OTP
    good_verify_resp = await async_client.post(
        "/api/v1/auth/otp/verify",
        json={"phone": test_phone, "otp": generated_otp, "role": "seller", "name": "Ramesh Artisan"},
    )
    assert good_verify_resp.status_code == 200
    auth_data = good_verify_resp.json()
    assert "user" in auth_data
    assert "tokens" in auth_data
    assert auth_data["user"]["phone"] == test_phone
    assert auth_data["user"]["name"] == "Ramesh Artisan"
    assert "seller" in auth_data["user"]["roles"]
    
    access_token = auth_data["tokens"]["access_token"]
    refresh_token = auth_data["tokens"]["refresh_token"]
    assert access_token is not None
    assert refresh_token is not None

    # 4. Access protected /me route
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["phone"] == test_phone

    # 5. Access seller-only protected route
    seller_resp = await async_client.get("/api/v1/auth/seller-only", headers=headers)
    assert seller_resp.status_code == 200
    assert seller_resp.json()["success"] is True

    # 6. Test Refresh Token
    refresh_resp = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    # 7. Unauthenticated request should fail
    unauth_resp = await async_client.get("/api/v1/auth/me")
    assert unauth_resp.status_code in [401, 403]
