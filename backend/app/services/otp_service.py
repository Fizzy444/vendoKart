import asyncio
import logging
import random
import time
from typing import Dict, Optional, Tuple
from twilio.rest import Client
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
    def _get_twilio_client(cls) -> Optional[Client]:
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
        return None

    @classmethod
    def _send_twilio_sms_sync(cls, phone: str, otp: str):
        client = cls._get_twilio_client()
        if not client:
            logger.warning("Twilio client credentials not configured.")
            return

        clean_phone = phone.strip()
        if not clean_phone.startswith("+"):
            clean_phone = f"+{clean_phone}"

        body = f"Your Twilio verification code is: {otp}"

        try:
            if settings.TWILIO_VERIFY_SERVICE_SID:
                # Official Twilio Verify API (Works seamlessly on Trial & Paid accounts)
                verification = client.verify.v2.services(
                    settings.TWILIO_VERIFY_SERVICE_SID
                ).verifications.create(to=clean_phone, channel="sms")
                logger.info(f"Twilio Verify SMS requested successfully. SID: {verification.sid} to {clean_phone}")
            elif settings.TWILIO_PHONE_NUMBER:
                # Standard Twilio Programmable SMS
                msg = client.messages.create(
                    body=body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=clean_phone,
                )
                logger.info(f"Twilio SMS message sent successfully. SID: {msg.sid} to {clean_phone}")
            else:
                logger.info(
                    f"[Twilio Info] No TWILIO_PHONE_NUMBER set in .env. Code: {otp}"
                )
        except Exception as e:
            logger.error(f"Error sending SMS via Twilio: {e}")

    @classmethod
    def _verify_twilio_otp_sync(cls, phone: str, otp: str) -> bool:
        client = cls._get_twilio_client()
        if not client or not settings.TWILIO_VERIFY_SERVICE_SID:
            return False

        clean_phone = phone.strip()
        if not clean_phone.startswith("+"):
            clean_phone = f"+{clean_phone}"

        try:
            check = client.verify.v2.services(
                settings.TWILIO_VERIFY_SERVICE_SID
            ).verification_checks.create(to=clean_phone, code=otp)
            logger.info(f"Twilio Verify check status: {check.status}")
            return check.status == "approved"
        except Exception as e:
            logger.error(f"Error verifying OTP with Twilio Verify: {e}")
            return False

    @classmethod
    async def generate_otp(cls, phone: str) -> Tuple[str, bool]:
        is_dev = cls.is_dev_mode()

        if is_dev and settings.DEV_MOCK_OTP:
            otp = settings.DEV_MOCK_OTP
        else:
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
                logger.info(f"Stored OTP in Redis for phone {phone}")
            except Exception as e:
                logger.warning(f"Failed to store OTP in Redis: {e}. Falling back to memory cache.")

        if not stored_in_redis:
            expiry = time.time() + settings.OTP_EXPIRY_SECONDS
            _in_memory_otp_cache[phone] = (otp, expiry)
            logger.info(f"Stored OTP in in-memory cache for phone {phone}")

        # Send SMS via Twilio in background thread if configured
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                await asyncio.to_thread(cls._send_twilio_sms_sync, phone, otp)
            except Exception as e:
                logger.error(f"Failed to trigger Twilio SMS dispatch task: {e}")

        return otp, is_dev

    @classmethod
    async def verify_otp(cls, phone: str, otp: str) -> bool:
        # Dev mode mock override
        if cls.is_dev_mode() and otp == settings.DEV_MOCK_OTP:
            logger.info(f"Verified dev mock OTP for phone {phone}")
            return True

        # Check Twilio Verify Service if active
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_VERIFY_SERVICE_SID:
            try:
                approved = await asyncio.to_thread(cls._verify_twilio_otp_sync, phone, otp)
                if approved:
                    return True
            except Exception as e:
                logger.warning(f"Twilio Verify check failed: {e}")

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
