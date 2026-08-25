import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure project root (containing `ai` and `backend`) is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.repositories.product_repository import ProductRepository
from app.repositories.chroma_repository import ChromaRepository
from app.core.database import (
    close_mongo_connection,
    close_redis_connection,
    connect_to_mongo,
    connect_to_redis,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("artisan.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing application lifespan...")
    await connect_to_mongo()
    await connect_to_redis()
    await ChromaRepository.initialize_and_migrate(ProductRepository._PRODUCTS_SEED)
    yield
    logger.info("Shutting down application lifespan...")
    await close_mongo_connection()
    await close_redis_connection()


app = FastAPI(
    title="Artisan Commerce (vendoKart) API",
    description="AI-powered digital commerce enablement platform for traditional artisans and small producers.",
    version="0.1.0-stage0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "version": "0.1.0-stage0",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Please check logs."},
    )
