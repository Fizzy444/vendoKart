import logging
import random
import time
from typing import Dict, Optional, Tuple
from app.core.config import settings
from app.core.database import get_redis_client

logger = logging.getLogger("artisan.service.otp")

# In-memory fallback cache for OTPs if Redis is not running: {phone: (otp, expiry_timestamp)}
_in_memory_otp_cache: Dict[str, Tuple[str, float]] = {}


class OTPService:
    @classmethod
    def is_dev_mode(cls) -> bool:
        return (
            settings.APP_ENV.lower() == "development"
            or settings.OTP_PROVIDER == "dev_mock"
        )

    @classmethod
    async def generate_otp(cls, phone: str) -> Tuple[str, bool]:
        is_dev = cls.is_dev_mode()
        
        if is_dev and settings.DEV_MOCK_OTP:
            otp = settings.DEV_MOCK_OTP
        else:
            otp = f"{random.randint(100000, 999999)}"

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
                logger.info(f"Stored OTP in Redis for phone {phone}")
            except Exception as e:
                logger.warning(f"Failed to store OTP in Redis: {e}. Falling back to memory cache.")

        if not stored_in_redis:
            expiry = time.time() + settings.OTP_EXPIRY_SECONDS
            _in_memory_otp_cache[phone] = (otp, expiry)
            logger.info(f"Stored OTP in in-memory cache for phone {phone}")

        return otp, is_dev

    @classmethod
    async def verify_otp(cls, phone: str, otp: str) -> bool:
        # Dev mode mock override
        if cls.is_dev_mode() and otp == settings.DEV_MOCK_OTP:
            logger.info(f"Verified dev mock OTP for phone {phone}")
            return True

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
