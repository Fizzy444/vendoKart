import logging
import random
import time
from typing import Dict, Optional, Tuple
from app.core.config import settings
from app.core.database import get_redis_client

logger = logging.getLogger("artisan.service.otp")

# In-memory fallback cache for OTPs if Redis is not running: {phone: (otp, expiry_timestamp)}
_in_memory_otp_cache: Dict[str, Tuple[str, float]] = {}

# Firebase Admin app initialized flag
_firebase_initialized = False


def _init_firebase_admin():
    global _firebase_initialized
    if _firebase_initialized:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials

        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with service account certificate.")
        elif settings.FIREBASE_PROJECT_ID:
            firebase_admin.initialize_app(options={"projectId": settings.FIREBASE_PROJECT_ID})
            _firebase_initialized = True
            logger.info(f"Firebase Admin initialized with project ID: {settings.FIREBASE_PROJECT_ID}")
        else:
            # Initialize default app if ADC or env is present
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with default credentials.")
        return True
    except Exception as e:
        logger.warning(f"Firebase Admin SDK initialization skipped: {e}")
        return False


class OTPService:
    @classmethod
    def is_dev_mode(cls) -> bool:
        return (
            settings.APP_ENV.lower() == "development"
            or settings.OTP_PROVIDER == "dev_mock"
        )

    @classmethod
    async def verify_firebase_id_token(cls, id_token: str) -> Optional[Dict]:
        """
        Verify a Firebase ID token sent from the client.
        Returns decoded token dict containing phone_number and uid if valid.
        """
        try:
            import firebase_admin
            from firebase_admin import auth

            if _init_firebase_admin():
                decoded_token = auth.verify_id_token(id_token)
                logger.info(f"Successfully verified Firebase ID token for UID: {decoded_token.get('uid')}")
                return decoded_token
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")

        # In dev mode, allow mock token verification
        if cls.is_dev_mode() and id_token.startswith("dev-mock-token-"):
            phone = id_token.replace("dev-mock-token-", "")
            return {
                "uid": f"dev_{phone.replace('+', '')}",
                "phone_number": phone,
                "firebase": {"sign_in_provider": "phone"},
            }

        return None

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

        return otp, is_dev

    @classmethod
    async def verify_otp(cls, phone: str, otp: str) -> bool:
        # Dev mode mock override
        if cls.is_dev_mode() and otp == settings.DEV_MOCK_OTP:
            logger.info(f"Verified dev mock OTP for phone {phone}")
            return True

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
