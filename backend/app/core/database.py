import asyncio
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
    is_mongo_online: bool = False
    is_redis_online: bool = False


db_state = Database()


async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    try:
        db_state.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=800,
            connectTimeoutMS=800,
            socketTimeoutMS=800,
        )
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
        # Quick ping to verify connectivity with 800ms timeout
        await asyncio.wait_for(db_state.client.admin.command("ping"), timeout=0.8)
        db_state.is_mongo_online = True
        logger.info(f"Connected to MongoDB database: {settings.MONGODB_DATABASE}")

        # Ensure indexes
        await _create_indexes(db_state.db)
    except Exception as e:
        db_state.is_mongo_online = False
        logger.warning(f"MongoDB not reachable on startup ({e}). Resilient in-memory store activated.")


async def _create_indexes(db: AsyncIOMotorDatabase):
    """Ensure core database indexes are created on startup."""
    try:
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("created_at")
        await db.sellers.create_index("user_id", unique=True)
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
            socket_timeout=1,
        )
        await db_state.redis.ping()
        db_state.is_redis_online = True
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        db_state.is_redis_online = False
        logger.warning(f"Redis not reachable ({e}). Using in-memory session cache.")


async def close_redis_connection():
    logger.info("Closing Redis connection...")
    if db_state.redis is not None:
        await db_state.redis.aclose()
        logger.info("Redis connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    if db_state.db is None:
        if db_state.client is None:
            db_state.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=800,
                connectTimeoutMS=800,
                socketTimeoutMS=800,
            )
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
    return db_state.db


def get_redis_client() -> Optional[aioredis.Redis]:
    if not db_state.is_redis_online:
        return None
    return db_state.redis
