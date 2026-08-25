import asyncio
import logging
import time
from typing import AsyncGenerator, Optional
import redis.asyncio as aioredis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

logger = logging.getLogger("artisan.database")


class DatabaseState:
    engine: Optional[AsyncEngine] = None
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None
    redis: Optional[aioredis.Redis] = None
    is_db_online: bool = False
    is_postgres_online: bool = False
    is_redis_online: bool = False
    database_url: str = ""


db_state = DatabaseState()


async def connect_to_postgres():
    """Initializes async database connection, creates tables, and verifies health."""
    db_url = settings.async_database_url
    logger.info(f"Connecting to PostgreSQL database at {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}...")
    
    try:
<<<<<<< HEAD
        db_state.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=1000,
        )
        db_state.db = db_state.client[settings.MONGODB_DATABASE]
        # Quick ping with 1s timeout
        await asyncio.wait_for(db_state.client.admin.command("ping"), timeout=1.0)
        logger.info(f"Connected to MongoDB database: {settings.MONGODB_DATABASE}")
=======
        engine = create_async_engine(
            db_url,
            echo=False,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"timeout": 2.0} if "asyncpg" in db_url else {},
        )
        
        # Test connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        db_state.engine = engine
        db_state.session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        db_state.is_db_online = True
        db_state.is_postgres_online = True
        db_state.database_url = db_url
        logger.info(f"Connected to PostgreSQL database: {settings.POSTGRES_DB}")
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9

        # Ensure all tables exist
        await create_tables()
        logger.info("PostgreSQL database tables and schemas verified successfully.")
    except Exception as e:
<<<<<<< HEAD
        logger.info("MongoDB offline in local dev mode. Continuing with fallback in-memory state.")
=======
        logger.warning(f"PostgreSQL not reachable at {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT} ({e}).")
        logger.info("Activating resilient SQLite async store for offline local operation / testing...")
        
        # Fallback to local SQLite async database so the app can always start
        sqlite_url = "sqlite+aiosqlite:///artisan_commerce_dev.db"
        fallback_engine = create_async_engine(sqlite_url, echo=False)
        db_state.engine = fallback_engine
        db_state.session_factory = async_sessionmaker(
            bind=fallback_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        db_state.is_db_online = True
        db_state.is_postgres_online = False
        db_state.database_url = sqlite_url
        await create_tables()
        logger.info("Resilient local SQLite database initialized with all tables.")
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9


async def create_tables():
    """Create all relational tables defined in models and ensure columns exist."""
    if db_state.engine is not None:
        from app.models.base import Base
        import app.models  # noqa: F401
        async with db_state.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Safe schema auto-migration for dev SQLite databases
            if "sqlite" in str(db_state.database_url):
                migrations = [
                    ("users", [
                        ("latitude", "FLOAT"),
                        ("longitude", "FLOAT"),
                        ("city", "VARCHAR(100)"),
                        ("state", "VARCHAR(100)"),
                        ("pincode", "VARCHAR(20)"),
                    ]),
                    ("sellers", [
                        ("latitude", "FLOAT"),
                        ("longitude", "FLOAT"),
                        ("address", "VARCHAR(255)"),
                        ("city", "VARCHAR(100)"),
                        ("district", "VARCHAR(100)"),
                        ("state", "VARCHAR(100)"),
                        ("pincode", "VARCHAR(20)"),
                    ]),
                ]
                for table, columns in migrations:
                    for col_name, col_type in columns:
                        try:
                            await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"))
                        except Exception:
                            pass


async def close_db_connection():
    """Disposes database connection pool."""
    logger.info("Closing database connection pool...")
    if db_state.engine is not None:
        await db_state.engine.dispose()
        db_state.engine = None
        db_state.session_factory = None
        db_state.is_db_online = False
        db_state.is_postgres_online = False
        logger.info("Database connection closed.")


async def connect_to_redis():
    """Initializes Redis connection."""
    logger.info(f"Connecting to Redis at {settings.REDIS_URL}...")
    try:
        r_client = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
<<<<<<< HEAD
            socket_timeout=1.0,
            retry_on_timeout=False,
        )
        await asyncio.wait_for(r_client.ping(), timeout=1.0)
        db_state.redis = r_client
        logger.info("Connected to Redis successfully.")
    except Exception:
        db_state.redis = None
        logger.info("Redis offline in local dev mode. Continuing with in-memory session cache.")
=======
            socket_timeout=1,
        )
        await db_state.redis.ping()
        db_state.is_redis_online = True
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        db_state.is_redis_online = False
        logger.warning(f"Redis not reachable ({e}). Using in-memory session cache.")
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9


async def close_redis_connection():
    """Closes Redis connection."""
    logger.info("Closing Redis connection...")
    if db_state.redis is not None:
        await db_state.redis.aclose()
        db_state.redis = None
        db_state.is_redis_online = False
        logger.info("Redis connection closed.")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for yielding transactional database sessions."""
    if db_state.session_factory is None:
        await connect_to_postgres()
    
    if db_state.session_factory is not None:
        async with db_state.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    else:
        raise RuntimeError("Database session factory is not initialized")


def get_db_session() -> AsyncSession:
    """Creates a standalone session (for repositories/services outside request context)."""
    if db_state.session_factory is None:
        raise RuntimeError("Database session factory is not initialized")
    return db_state.session_factory()


async def ping_database() -> float:
    """Pings database and returns query latency in milliseconds."""
    if db_state.engine is None:
        raise RuntimeError("Database engine is not initialized")
    start = time.perf_counter()
    async with db_state.engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return round((time.perf_counter() - start) * 1000, 2)


def is_db_online() -> bool:
    return db_state.is_db_online


def get_redis_client() -> Optional[aioredis.Redis]:
    if not db_state.is_redis_online:
        return None
    return db_state.redis
