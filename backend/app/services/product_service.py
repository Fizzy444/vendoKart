import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.models.product import ProductInDB, ProductStatus
from app.models.seller import SellerProfileInDB
from app.models.user import UserInDB, UserRole
from app.repositories.product_repository import ProductRepository
from app.repositories.seller_repository import SellerRepository
from app.repositories.user_repository import UserRepository
from app.schemas.product import (
    PricingPreviewRequest,
    PricingPreviewResponse,
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
)
from app.services.pricing_engine import DeterministicPricingEngine, PricingBreakdown, PricingInputs


from app.services.seller_service import SellerService


class ProductService:
    product_repo = ProductRepository()
    seller_repo = SellerRepository()

    @classmethod
    async def calculate_pricing_preview(cls, req: PricingPreviewRequest) -> PricingPreviewResponse:
        pricing = DeterministicPricingEngine.calculate_pricing(req)
        return PricingPreviewResponse(pricing=pricing)

    @classmethod
    async def create_product(cls, user: UserInDB, req: ProductCreateRequest) -> ProductResponse:
        # Ensure user has seller role enabled
        if UserRole.SELLER not in user.roles:
            user_roles = list(set([r.value if hasattr(r, "value") else str(r) for r in user.roles] + [UserRole.SELLER.value]))
            updated_user = await UserRepository.update(user.id, {"roles": user_roles})
            if updated_user:
                user = updated_user

        # Get or auto-initialize seller profile for workspace defaults
        seller_profile = await SellerService.get_or_create_profile(user)
        seller = await cls.seller_repo.get_by_user_id(user.id)
        if not seller:
            seller = seller_profile

        # Fallback to seller's workspace parameters if not explicitly provided
        labour_rate = req.labour_daily_rate_inr if req.labour_daily_rate_inr is not None else float(seller.daily_labour_rate_inr)
        workers_count = req.workers_count if req.workers_count is not None else seller.number_of_workers
        daily_capacity = req.daily_capacity_units if req.daily_capacity_units is not None else float(seller.daily_capacity_units)

        # Run Deterministic Pricing Engine (§11)
        pricing_inputs = PricingInputs(
            material_cost_inr=req.material_cost_inr,
            labour_daily_rate_inr=labour_rate,
            workers_count=workers_count,
            daily_capacity_units=daily_capacity,
            production_days=req.production_days,
            packaging_cost_inr=req.packaging_cost_inr,
            energy_cost_inr=req.energy_cost_inr,
            other_direct_cost_inr=req.other_direct_cost_inr,
            target_margin_percent=req.target_margin_percent,
        )
        pricing = DeterministicPricingEngine.calculate_pricing(pricing_inputs)

        # Listed price determination (custom or recommended)
        listed_price = pricing.recommended_price_inr
        if req.custom_listed_price_inr is not None:
            if req.custom_listed_price_inr < pricing.minimum_floor_price_inr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Price cannot be lower than the fair production floor price of ₹{pricing.minimum_floor_price_inr}",
                )
            listed_price = req.custom_listed_price_inr

        product_id = f"prod_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        product = ProductInDB(
            _id=product_id,
            seller_id=seller.id or f"seller_{user.id}",
            user_id=user.id,
            title=req.title,
            description=req.description,
            craft_category=req.craft_category,
            craft_specialty=req.craft_specialty,
            material_type=req.material_type,
            material_cost_inr=req.material_cost_inr,
            labour_daily_rate_inr=labour_rate,
            workers_count=workers_count,
            daily_capacity_units=daily_capacity,
            production_days=req.production_days,
            packaging_cost_inr=req.packaging_cost_inr,
            energy_cost_inr=req.energy_cost_inr,
            other_direct_cost_inr=req.other_direct_cost_inr,
            target_margin_percent=req.target_margin_percent,
            pricing=pricing,
            listed_price_inr=listed_price,
            stock_quantity=req.stock_quantity,
            lead_time_days=req.lead_time_days,
            is_customizable=req.is_customizable,
            images=req.images,
            dimensions=req.dimensions,
            tags=req.tags,
            status=req.status,
            created_at=now,
            updated_at=now,
        )

        saved = await cls.product_repo.create(product)
        return cls._to_response(saved)

    @classmethod
    async def get_seller_products(cls, user: UserInDB) -> List[ProductResponse]:
        seller = await cls.seller_repo.get_by_user_id(user.id)
        if not seller:
            seller = await SellerService.get_or_create_profile(user)
        seller_id = str(seller.id) if seller.id else f"seller_{user.id}"
        products = await cls.product_repo.list_by_seller(seller_id)
        return [cls._to_response(p) for p in products]

    @classmethod
    async def get_product_by_id(cls, product_id: str) -> ProductResponse:
        prod = await cls.product_repo.get_by_id(product_id)
        if not prod:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return cls._to_response(prod)

    @classmethod
    async def update_product(
        cls, product_id: str, user: UserInDB, req: ProductUpdateRequest
    ) -> ProductResponse:
        existing = await cls.product_repo.get_by_id(product_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if existing.user_id != user.id and not user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this product")

        update_dict = req.model_dump(exclude_unset=True)

        # Check if cost/production inputs changed -> recalculate deterministic pricing
        recalc_keys = {
            "material_cost_inr",
            "labour_daily_rate_inr",
            "workers_count",
            "daily_capacity_units",
            "production_days",
            "packaging_cost_inr",
            "energy_cost_inr",
            "other_direct_cost_inr",
            "target_margin_percent",
        }
        if any(k in update_dict for k in recalc_keys):
            inputs = PricingInputs(
                material_cost_inr=update_dict.get("material_cost_inr", existing.material_cost_inr),
                labour_daily_rate_inr=update_dict.get("labour_daily_rate_inr", existing.labour_daily_rate_inr),
                workers_count=update_dict.get("workers_count", existing.workers_count),
                daily_capacity_units=update_dict.get("daily_capacity_units", existing.daily_capacity_units),
                production_days=update_dict.get("production_days", existing.production_days),
                packaging_cost_inr=update_dict.get("packaging_cost_inr", existing.packaging_cost_inr),
                energy_cost_inr=update_dict.get("energy_cost_inr", existing.energy_cost_inr),
                other_direct_cost_inr=update_dict.get("other_direct_cost_inr", existing.other_direct_cost_inr),
                target_margin_percent=update_dict.get("target_margin_percent", existing.target_margin_percent),
            )
            new_pricing = DeterministicPricingEngine.calculate_pricing(inputs)
            update_dict["pricing"] = new_pricing.model_dump()
            if "custom_listed_price_inr" not in update_dict:
                update_dict["listed_price_inr"] = new_pricing.recommended_price_inr

        if "custom_listed_price_inr" in update_dict and update_dict["custom_listed_price_inr"] is not None:
            update_dict["listed_price_inr"] = update_dict.pop("custom_listed_price_inr")

        updated = await cls.product_repo.update(product_id, update_dict)
        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product")
        return cls._to_response(updated)

    @classmethod
    async def delete_product(cls, product_id: str, user: UserInDB) -> Dict[str, Any]:
        existing = await cls.product_repo.get_by_id(product_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if existing.user_id != user.id and not user.is_superuser:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this product")

        success = await cls.product_repo.delete(product_id)
        return {"success": success, "message": "Product deleted successfully"}

    @classmethod
    async def list_marketplace_products(
        cls, limit: int = 50, category: Optional[str] = None
    ) -> List[ProductResponse]:
        products = await cls.product_repo.list_published(limit=limit, category=category)
        return [cls._to_response(p) for p in products]

    @classmethod
    def _to_response(cls, p: ProductInDB) -> ProductResponse:
        return ProductResponse(
            id=p.id,
            seller_id=p.seller_id,
            user_id=p.user_id,
            title=p.title,
            description=p.description,
            craft_category=p.craft_category,
            craft_specialty=p.craft_specialty,
            material_type=p.material_type,
            material_cost_inr=p.material_cost_inr,
            labour_daily_rate_inr=p.labour_daily_rate_inr,
            workers_count=p.workers_count,
            daily_capacity_units=p.daily_capacity_units,
            production_days=p.production_days,
            packaging_cost_inr=p.packaging_cost_inr,
            energy_cost_inr=p.energy_cost_inr,
            other_direct_cost_inr=p.other_direct_cost_inr,
            target_margin_percent=p.target_margin_percent,
            pricing=p.pricing,
            listed_price_inr=p.listed_price_inr,
            stock_quantity=p.stock_quantity,
            lead_time_days=p.lead_time_days,
            is_customizable=p.is_customizable,
            images=p.images,
            dimensions=p.dimensions,
            tags=p.tags,
            status=p.status,
            views_count=p.views_count,
            orders_count=p.orders_count,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
