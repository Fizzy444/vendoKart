import logging
import time
from typing import Dict, Optional, Tuple
import httpx
from app.core.config import settings
from app.core.database import get_redis_client

logger = logging.getLogger("artisan.service.otp")

# In-memory fallback: {phone: (session_id, expiry_ts)}
_in_memory_session_cache: Dict[str, Tuple[str, float]] = {}


class OTPService:
    """
    OTP via 2Factor.in voice call.
      - Send:   GET /API/V1/{key}/SMS/{phone}/AUTOGEN  → voice call with OTP
      - Verify: GET /API/V1/{key}/SMS/VERIFY3/{phone}/{otp}
    """

    @classmethod
    def _phone_with_country_code(cls, phone: str) -> str:
        """Return 91XXXXXXXXXX (12 digits)."""
        digits = "".join(filter(str.isdigit, phone))
        if len(digits) == 12 and digits.startswith("91"):
            return digits
        return f"91{digits[-10:]}"

    # ------------------------------------------------------------------
    # Send OTP via 2Factor voice call
    # ------------------------------------------------------------------
    @classmethod
    async def _send_2factor_voice(cls, phone: str) -> Optional[str]:
        api_key = settings.TWOFACTOR_API_KEY
        if not api_key:
            logger.error("TWOFACTOR_API_KEY is not set")
            return None

        phone_fmt = cls._phone_with_country_code(phone)
        url = f"https://2factor.in/API/V1/{api_key}/SMS/{phone_fmt}/AUTOGEN"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                data = resp.json()
                if resp.status_code == 200 and data.get("Status") == "Success":
                    session_id = str(data.get("Details", ""))
                    logger.info(f"2Factor voice OTP sent to {phone_fmt}. Session: {session_id}")
                    return session_id
                else:
                    logger.error(f"2Factor dispatch failed: {data}")
                    return None
        except Exception as e:
            logger.error(f"2Factor connection error: {e}")
            return None

    # ------------------------------------------------------------------
    # generate_otp — sends voice OTP, stores session_id
    # ------------------------------------------------------------------
    @classmethod
    async def generate_otp(cls, phone: str) -> str:
        session_id = await cls._send_2factor_voice(phone)
        if session_id:
            await cls._store_session(phone, session_id)
        else:
            logger.error(f"2Factor voice OTP failed for {phone}")
        return session_id or ""

    # ------------------------------------------------------------------
    # verify_otp — verify via 2Factor VERIFY3
    # ------------------------------------------------------------------
    @classmethod
    async def verify_otp(cls, phone: str, otp: str) -> bool:
        clean_otp = otp.strip()
        api_key = settings.TWOFACTOR_API_KEY
        phone_fmt = cls._phone_with_country_code(phone)

        # Check we have a live session for this phone
        session_id = await cls._get_session(phone)
        if not session_id:
            logger.warning(f"No active OTP session for {phone}")
            return False

        url = f"https://2factor.in/API/V1/{api_key}/SMS/VERIFY3/{phone_fmt}/{clean_otp}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                data = resp.json()
                if data.get("Details") == "OTP Matched":
                    logger.info(f"OTP verified for {phone}")
                    await cls._cleanup_cache(phone)
                    return True
                else:
                    logger.warning(f"OTP mismatch for {phone}: {data}")
                    return False
        except Exception as e:
            logger.error(f"2Factor VERIFY3 error: {e}")
            return False

    # ------------------------------------------------------------------
    # Cache helpers (Redis → in-memory fallback)
    # ------------------------------------------------------------------
    @classmethod
    async def _store_session(cls, phone: str, session_id: str) -> None:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                await redis_client.setex(
                    f"otp_session:{phone}", settings.OTP_EXPIRY_SECONDS, session_id
                )
                return
            except Exception as e:
                logger.warning(f"Redis store error: {e}")
        expiry = time.time() + settings.OTP_EXPIRY_SECONDS
        _in_memory_session_cache[phone] = (session_id, expiry)

    @classmethod
    async def _get_session(cls, phone: str) -> Optional[str]:
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                raw = await redis_client.get(f"otp_session:{phone}")
                if raw:
                    return str(raw).strip()
            except Exception:
                pass
        if phone in _in_memory_session_cache:
            session_id, expiry = _in_memory_session_cache[phone]
            if time.time() <= expiry:
                return session_id
        return None

    @classmethod
    async def _cleanup_cache(cls, phone: str) -> None:
        redis_client = get_redis_client()
        if redis_client:
            try:
                await redis_client.delete(f"otp_session:{phone}")
            except Exception:
                pass
        _in_memory_session_cache.pop(phone, None)
