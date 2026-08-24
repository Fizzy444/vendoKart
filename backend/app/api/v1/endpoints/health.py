import time
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import db_state, get_database, get_redis_client
from app.schemas.response import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    System health check endpoint verifying database, cache, and service status.
    """
    db_status = "unhealthy"
    db_latency_ms = None
    try:
        if db_state.client is not None:
            start = time.perf_counter()
            await db_state.client.admin.command("ping")
            db_latency_ms = round((time.perf_counter() - start) * 1000, 2)
            db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    redis_status = "unhealthy"
    redis_latency_ms = None
    try:
        redis_client = get_redis_client()
        if redis_client is not None:
            start = time.perf_counter()
            await redis_client.ping()
            redis_latency_ms = round((time.perf_counter() - start) * 1000, 2)
            redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"

    # MinIO / Storage status
    storage_status = "configured"
    
    overall_status = (
        "healthy" if (db_status == "healthy" and redis_status == "healthy") else "degraded"
    )

    return HealthResponse(
        status=overall_status,
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV,
        database={
            "status": db_status,
            "database_name": settings.MONGODB_DATABASE,
            "latency_ms": db_latency_ms,
        },
        redis={
            "status": redis_status,
            "latency_ms": redis_latency_ms,
        },
        storage={
            "status": storage_status,
            "bucket": settings.S3_BUCKET,
            "endpoint": settings.S3_ENDPOINT,
        },
    )
