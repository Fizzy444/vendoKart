from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, products, sellers

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(sellers.router, prefix="/sellers", tags=["Sellers"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
