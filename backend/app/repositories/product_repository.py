import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import delete, select
from app.core.database import db_state
from app.models.product import ProductInDB, ProductModel, ProductStatus

logger = logging.getLogger("artisan.repository.product")


def _sanitize_json(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [_sanitize_json(i) for i in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, "value"):
        return obj.value
    elif hasattr(obj, "model_dump"):
        return _sanitize_json(obj.model_dump())
    return obj


class ProductRepository:
    def __init__(self, db: Optional[Any] = None):
        self._db = db

    async def create(self, product: ProductInDB) -> ProductInDB:
        if not db_state.session_factory:
            return product

        pricing_dict = (
            product.pricing.model_dump()
            if hasattr(product.pricing, "model_dump")
            else dict(product.pricing)
        )
        dims_dict = (
            product.dimensions.model_dump()
            if product.dimensions and hasattr(product.dimensions, "model_dump")
            else None
        )

        craft_cat = (
            product.craft_category.value
            if hasattr(product.craft_category, "value")
            else str(product.craft_category)
        )
        status_val = (
            product.status.value
            if hasattr(product.status, "value")
            else str(product.status)
        )

        prod_model = ProductModel(
            id=str(product.id),
            seller_id=str(product.seller_id),
            user_id=str(product.user_id),
            title=product.title,
            description=product.description,
            craft_category=craft_cat,
            craft_specialty=product.craft_specialty,
            material_type=product.material_type,
            material_cost_inr=product.material_cost_inr,
            labour_daily_rate_inr=product.labour_daily_rate_inr,
            workers_count=product.workers_count,
            daily_capacity_units=product.daily_capacity_units,
            production_days=product.production_days,
            packaging_cost_inr=product.packaging_cost_inr,
            energy_cost_inr=product.energy_cost_inr,
            other_direct_cost_inr=product.other_direct_cost_inr,
            target_margin_percent=product.target_margin_percent,
            pricing=_sanitize_json(pricing_dict),
            listed_price_inr=product.listed_price_inr,
            stock_quantity=product.stock_quantity,
            lead_time_days=product.lead_time_days,
            is_customizable=product.is_customizable,
            images=_sanitize_json(product.images or []),
            dimensions=_sanitize_json(dims_dict),
            tags=_sanitize_json(product.tags or []),
            status=status_val,
            views_count=product.views_count or 0,
            orders_count=product.orders_count or 0,
            created_at=product.created_at or datetime.now(timezone.utc),
            updated_at=product.updated_at or datetime.now(timezone.utc),
        )

        try:
            async with db_state.session_factory() as session:
                session.add(prod_model)
                await session.commit()
                await session.refresh(prod_model)
                return prod_model.to_pydantic()
        except Exception as e:
            logger.error(f"Database error in product create: {e}", exc_info=True)
            raise

    async def get_by_id(self, product_id: str) -> Optional[ProductInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(ProductModel).where(ProductModel.id == product_id)
                result = await session.execute(stmt)
                prod_model = result.scalar_one_or_none()
                if prod_model:
                    return prod_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in product get_by_id: {e}")
        return None

    async def list_by_seller(self, seller_id: str) -> List[ProductInDB]:
        if not db_state.session_factory:
            return []
        try:
            async with db_state.session_factory() as session:
                stmt = (
                    select(ProductModel)
                    .where((ProductModel.seller_id == seller_id) | (ProductModel.user_id == seller_id))
                    .order_by(ProductModel.created_at.desc())
                )
                result = await session.execute(stmt)
                models = result.scalars().all()
                return [m.to_pydantic() for m in models]
        except Exception as e:
            logger.warning(f"Database error in product list_by_seller: {e}")
            return []

    async def list_published(self, limit: int = 50, category: Optional[str] = None) -> List[ProductInDB]:
        if not db_state.session_factory:
            return []
        try:
            async with db_state.session_factory() as session:
                stmt = select(ProductModel).where(ProductModel.status == ProductStatus.PUBLISHED.value)
                if category:
                    stmt = stmt.where(ProductModel.craft_category == category)
                stmt = stmt.order_by(ProductModel.created_at.desc()).limit(limit)
                
                result = await session.execute(stmt)
                models = result.scalars().all()
                return [m.to_pydantic() for m in models]
        except Exception as e:
            logger.warning(f"Database error in product list_published: {e}")
            return []

    async def update(self, product_id: str, update_data: Dict[str, Any]) -> Optional[ProductInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(ProductModel).where(ProductModel.id == product_id)
                result = await session.execute(stmt)
                prod_model = result.scalar_one_or_none()
                if not prod_model:
                    return None

                for k, v in update_data.items():
                    if k in ("_id", "id", "seller_id", "user_id"):
                        continue
                    if k == "craft_category" and hasattr(v, "value"):
                        v = v.value
                    elif k == "status" and hasattr(v, "value"):
                        v = v.value
                    elif k in ("pricing", "dimensions", "images", "tags"):
                        v = _sanitize_json(v)
                    if hasattr(prod_model, k):
                        setattr(prod_model, k, v)

                prod_model.updated_at = datetime.now(timezone.utc)
                await session.commit()
                await session.refresh(prod_model)
                return prod_model.to_pydantic()
        except Exception as e:
            logger.error(f"Database error in product update: {e}", exc_info=True)
            return None

    async def delete(self, product_id: str) -> bool:
        if not db_state.session_factory:
            return False
        try:
            async with db_state.session_factory() as session:
                stmt = delete(ProductModel).where(ProductModel.id == product_id)
                result = await session.execute(stmt)
                await session.commit()
                rowcount = getattr(result, "rowcount", None)
                return bool(rowcount and rowcount > 0)
        except Exception as e:
            logger.error(f"Database error in product delete: {e}", exc_info=True)
            return False
