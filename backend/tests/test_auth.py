import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.services.otp_service import _in_memory_session_cache


@pytest.mark.asyncio
async def test_otp_flow_and_authentication(async_client: AsyncClient):
    test_phone = "+919876543210"
    fake_session_id = "test-2factor-session-123"

    # --- Step 1: Send OTP (mock 2Factor voice call) ---
    with patch(
        "app.services.otp_service.OTPService._send_2factor_voice",
        new_callable=AsyncMock,
        return_value=fake_session_id,
    ):
        send_resp = await async_client.post(
            "/api/v1/auth/otp/send",
            json={"phone": test_phone},
        )
        assert send_resp.status_code == 200
        data = send_resp.json()
        assert data["phone"] == test_phone
        assert "OTP sent successfully" in data["message"]

    # Confirm session was stored in in-memory cache
    assert test_phone in _in_memory_session_cache
    stored_session_id, _expiry = _in_memory_session_cache[test_phone]
    assert stored_session_id == fake_session_id

    # --- Step 2: Verify with wrong OTP ---
    with patch(
        "app.services.otp_service.OTPService.verify_otp",
        new_callable=AsyncMock,
        return_value=False,
    ):
        bad_resp = await async_client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": test_phone, "otp": "000000", "role": "seller"},
        )
        assert bad_resp.status_code == 400

    # --- Step 3: Verify with correct OTP ---
    with patch(
        "app.services.otp_service.OTPService.verify_otp",
        new_callable=AsyncMock,
        return_value=True,
    ):
        good_resp = await async_client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": test_phone, "otp": "123456", "role": "seller", "name": "Ramesh Artisan"},
        )
        assert good_resp.status_code == 200
        auth_data = good_resp.json()
        assert "user" in auth_data
        assert "tokens" in auth_data
        assert auth_data["user"]["phone"] == test_phone
        assert auth_data["user"]["name"] == "Ramesh Artisan"
        assert "seller" in auth_data["user"]["roles"]

    access_token = auth_data["tokens"]["access_token"]
    refresh_token = auth_data["tokens"]["refresh_token"]

    # --- Step 4: Protected route /me ---
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["phone"] == test_phone

    # --- Step 5: Seller-only route ---
    seller_resp = await async_client.get("/api/v1/auth/seller-only", headers=headers)
    assert seller_resp.status_code == 200
    assert seller_resp.json()["success"] is True

    # --- Step 6: Refresh tokens ---
    refresh_resp = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

    # --- Step 7: Unauthenticated ---
    unauth_resp = await async_client.get("/api/v1/auth/me")
    assert unauth_resp.status_code in [401, 403]
