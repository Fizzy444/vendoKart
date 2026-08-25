import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import delete, select
from app.core.database import db_state
from app.models.product import ProductInDB, ProductModel, ProductStatus
from app.schemas.search import ProductItem
from app.repositories.chroma_repository import ChromaRepository

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
    """
    Repository providing product access to authentic artisan crafts.
    Contains seed data for pottery, handloom textiles, brass lamps, wall hangings,
    bamboo craft, and home décor from artisan clusters across India.
    Includes time-based production capacity, shipping lead times, and unit pricing models.
    """

    _PRODUCTS_SEED: List[ProductItem] = []

    @classmethod
    async def get_all_products(cls) -> List[ProductItem]:
        """Returns all products from persistent ChromaDB vector storage."""
        try:
            products = await ChromaRepository.get_all_products()
            if products:
                return products
        except Exception:
            pass
        return []

    @classmethod
    async def get_product_by_id(cls, product_id: str) -> Optional[ProductItem]:
        """Finds product by unique ID from persistent ChromaDB vector storage."""
        try:
            prod = await ChromaRepository.get_product_by_id(product_id)
            if prod is not None:
                return prod
        except Exception:
            pass
        return None

    @classmethod
    async def toggle_favorite(cls, product_id: str) -> Optional[ProductItem]:
        """Toggles favorite status for a product in persistent ChromaDB vector storage."""
        try:
            updated = await ChromaRepository.toggle_favorite(product_id)
            if updated is not None:
                return updated
        except Exception:
            pass
        return None

    @classmethod
    async def create_product(cls, data: Dict[str, Any]) -> ProductInDB:
        import uuid
        prod_id = str(data.get("id") or data.get("_id") or f"prod_{uuid.uuid4().hex[:12]}")
        pricing_raw = data.get("pricing", {})
        pricing_dict = pricing_raw.model_dump() if hasattr(pricing_raw, "model_dump") else dict(pricing_raw)
        
        dims_raw = data.get("dimensions")
        dims_dict = dims_raw.model_dump() if hasattr(dims_raw, "model_dump") else (dict(dims_raw) if isinstance(dims_raw, dict) else None)

        craft_cat = data.get("craft_category", "Other Craft")
        if hasattr(craft_cat, "value"):
            craft_cat = craft_cat.value

        status_val = data.get("status", "published")
        if hasattr(status_val, "value"):
            status_val = status_val.value

        model = ProductModel(
            id=prod_id,
            seller_id=str(data["seller_id"]),
            user_id=str(data["user_id"]),
            title=data["title"],
            description=data["description"],
            craft_category=craft_cat,
            craft_specialty=data.get("craft_specialty"),
            material_type=data.get("material_type", "Traditional Material"),
            material_cost_inr=float(data.get("material_cost_inr", 0.0)),
            labour_daily_rate_inr=float(data.get("labour_daily_rate_inr", 400.0)),
            workers_count=int(data.get("workers_count", 1)),
            daily_capacity_units=float(data.get("daily_capacity_units", 5.0)),
            production_days=float(data.get("production_days", 1.0)),
            packaging_cost_inr=float(data.get("packaging_cost_inr", 20.0)),
            energy_cost_inr=float(data.get("energy_cost_inr", 0.0)),
            other_direct_cost_inr=float(data.get("other_direct_cost_inr", 0.0)),
            target_margin_percent=float(data.get("target_margin_percent", 25.0)),
            pricing=pricing_dict,
            listed_price_inr=float(data.get("listed_price_inr", 500.0)),
            stock_quantity=int(data.get("stock_quantity", 5)),
            lead_time_days=int(data.get("lead_time_days", 3)),
            is_customizable=bool(data.get("is_customizable", False)),
            images=data.get("images", []),
            dimensions=dims_dict,
            tags=data.get("tags", []),
            status=status_val
        )
        if db_state.session_factory:
            async with db_state.session_factory() as session:
                session.add(model)
                await session.commit()
                await session.refresh(model)
                return model.to_pydantic()
        return model.to_pydantic()

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
