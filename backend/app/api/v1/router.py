from fastapi import APIRouter
from app.api.v1.endpoints import auth, health, products, search, sellers, verification

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(sellers.router, prefix="/sellers", tags=["Sellers"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])

