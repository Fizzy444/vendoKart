import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("artisan.database")


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    redis: Optional[aioredis.Redis] = None


db_state = Database()


async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    try:
        db_state.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
        )
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
        # Quick ping to verify connectivity
        await db_state.client.admin.command("ping")
        logger.info(f"Connected to MongoDB database: {settings.MONGODB_DATABASE}")

        # Ensure indexes
        await _create_indexes(db_state.db)
    except Exception as e:
        logger.warning(f"MongoDB connection ping failed: {e}. Retrying on demand.")


async def _create_indexes(db: AsyncIOMotorDatabase):
    """Ensure core database indexes are created on startup."""
    try:
        # Users collection
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("created_at")
        logger.info("MongoDB indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")


async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db_state.client is not None:
        db_state.client.close()
        logger.info("MongoDB connection closed.")


async def connect_to_redis():
    logger.info(f"Connecting to Redis at {settings.REDIS_URL}...")
    try:
        db_state.redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_timeout=5,
        )
        await db_state.redis.ping()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")


async def close_redis_connection():
    logger.info("Closing Redis connection...")
    if db_state.redis is not None:
        await db_state.redis.aclose()
        logger.info("Redis connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    if db_state.db is None:
        if db_state.client is None:
            db_state.client = AsyncIOMotorClient(settings.MONGODB_URI)
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
    return db_state.db


def get_redis_client() -> Optional[aioredis.Redis]:
    return db_state.redis
