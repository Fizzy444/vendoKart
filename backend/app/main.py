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
    close_db_connection,
    close_redis_connection,
    connect_to_postgres,
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
    await connect_to_postgres()
    await connect_to_redis()
    await ChromaRepository.initialize_and_migrate(ProductRepository._PRODUCTS_SEED)
    yield
    logger.info("Shutting down application lifespan...")
    await close_db_connection()
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

<<<<<<< HEAD
# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
=======
# CORS configuration: Allow localhost, 127.0.0.1, and local LAN network IPs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9

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
