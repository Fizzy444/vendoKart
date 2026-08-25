from fastapi import APIRouter
<<<<<<< HEAD
from app.api.v1.endpoints import auth, health, search
=======
from app.api.v1.endpoints import auth, health, products, sellers, verification
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
<<<<<<< HEAD
api_router.include_router(search.router, prefix="/search", tags=["Search"])
=======
api_router.include_router(sellers.router, prefix="/sellers", tags=["Sellers"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9
