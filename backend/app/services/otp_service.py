import logging
import random
import time
from typing import Dict, Tuple
import httpx
from app.core.config import settings
from app.core.database import get_redis_client

logger = logging.getLogger("artisan.service.otp")

# In-memory fallback cache for OTPs if Redis is not running: {phone: (otp, expiry_timestamp)}
_in_memory_otp_cache: Dict[str, Tuple[str, float]] = {}


class OTPService:
    @classmethod
    async def _send_2factor_sms(cls, phone: str, otp: str) -> bool:
        """
        Dispatch live SMS OTP via 2Factor.in API.
        """
        api_key = settings.TWOFACTOR_API_KEY
        if not api_key:
            logger.warning("2Factor.in API Key is not configured.")
            return False

        clean_phone = phone.strip()
        if not clean_phone.startswith("+"):
            clean_phone = f"+{clean_phone}"

        template = getattr(settings, "TWOFACTOR_TEMPLATE_NAME", "") or ""

        # Try with template first if specified, otherwise default custom SMS endpoint
        urls_to_try = []
        if template:
            urls_to_try.append(f"https://2factor.in/API/V1/{api_key}/SMS/{clean_phone}/{otp}/{template}")
        urls_to_try.append(f"https://2factor.in/API/V1/{api_key}/SMS/{clean_phone}/{otp}")

        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in urls_to_try:
                try:
                    logger.info(f"Dispatching 2Factor SMS to {clean_phone}...")
                    response = await client.get(url)
                    data = response.json()
                    if response.status_code == 200 and data.get("Status") == "Success":
                        logger.info(f"2Factor.in SMS sent successfully to {clean_phone}. Details/Session: {data.get('Details')}")
                        return True
                    else:
                        logger.warning(f"2Factor.in SMS response for {url}: {data}")
                except Exception as e:
                    logger.error(f"Error calling 2Factor.in API url {url}: {e}")

        return False

    @classmethod
    async def generate_otp(cls, phone: str) -> str:
        """
        Generate a secure random 6-digit OTP, cache it, and dispatch via 2Factor SMS.
        """
        # Always generate genuine random 6-digit OTP
        otp = f"{random.randint(100000, 999999)}"

        # Store OTP in cache
        redis_client = get_redis_client()
        stored_in_redis = False

        if redis_client is not None:
            try:
                await redis_client.setex(
                    f"otp:{phone}",
                    settings.OTP_EXPIRY_SECONDS,
                    otp,
                )
                stored_in_redis = True
                logger.info(f"Stored random OTP in Redis for phone {phone}")
            except Exception as e:
                logger.warning(f"Failed to store OTP in Redis: {e}. Falling back to memory cache.")

        if not stored_in_redis:
            expiry = time.time() + settings.OTP_EXPIRY_SECONDS
            _in_memory_otp_cache[phone] = (otp, expiry)
            logger.info(f"Stored random OTP in in-memory cache for phone {phone}")

        # Send live SMS via 2Factor.in
        if settings.TWOFACTOR_API_KEY:
            try:
                await cls._send_2factor_sms(phone, otp)
            except Exception as e:
                logger.error(f"Failed to dispatch 2Factor SMS: {e}")

        return otp

    @classmethod
    async def verify_otp(cls, phone: str, otp: str) -> bool:
        """
        Verify the random OTP code against Redis / in-memory cache.
        """
        # Check Redis
        redis_client = get_redis_client()
        if redis_client is not None:
            try:
                cached_otp = await redis_client.get(f"otp:{phone}")
                if cached_otp and str(cached_otp).strip() == str(otp).strip():
                    await redis_client.delete(f"otp:{phone}")
                    return True
            except Exception as e:
                logger.warning(f"Error querying Redis for OTP: {e}")

        # Check in-memory fallback
        if phone in _in_memory_otp_cache:
            cached_otp, expiry = _in_memory_otp_cache[phone]
            if time.time() <= expiry:
                if str(cached_otp).strip() == str(otp).strip():
                    del _in_memory_otp_cache[phone]
                    return True
            else:
                del _in_memory_otp_cache[phone]

        return False
