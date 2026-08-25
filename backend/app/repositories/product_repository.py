<<<<<<< HEAD
from typing import List, Optional
from app.schemas.search import ProductItem
from app.repositories.chroma_repository import ChromaRepository


class ProductRepository:
    """
    Repository providing product access to authentic artisan crafts.
    Contains seed data for pottery, handloom textiles, brass lamps, wall hangings,
    bamboo craft, and home décor from artisan clusters across India.
    Includes time-based production capacity, shipping lead times, and unit pricing models.
    """

    _PRODUCTS_SEED: List[ProductItem] = [
        ProductItem(
            id="prod-001",
            name="Terracotta Pots (Set of 70)",
            artisan_name="Meenakshi Pottery (Artisan A)",
            is_verified_artisan=True,
            location="Kumbakonam, Tamil Nadu",
            category="Pottery",
            price=2800.0,
            price_per_unit=40.0,
            min_order_qty=70,
            delivery_days=4,
            production_capacity_per_day=20,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
            description="Handmade terracotta earthen pots crafted from natural river clay. Stock=10, capacity=20/day, shipping=1 day. Fully capable of 70 units in 4 days.",
            craft_type="Terracotta Clayware",
            rating=4.9,
            stock=10,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-002",
            name="Hand-painted Pots (Set of 70)",
            artisan_name="Rajasthani Crafts",
            is_verified_artisan=True,
            location="Jaipur, Rajasthan",
            category="Pottery",
            price=2950.0,
            price_per_unit=42.0,
            min_order_qty=50,
            delivery_days=3,
            production_capacity_per_day=30,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
            description="Vibrant hand-painted clay pots featuring traditional Rajasthani floral motifs. Eco-friendly acrylic colors sealed for long-lasting finish.",
            craft_type="Hand-painted Pottery",
            rating=4.8,
            stock=300,
            is_favorite=True,
        ),
        ProductItem(
            id="prod-003",
            name="Clay Planter Pots (Set of 70)",
            artisan_name="Earth & Clay Studio",
            is_verified_artisan=True,
            location="Auroville, Puducherry",
            category="Pottery",
            price=2700.0,
            price_per_unit=38.0,
            min_order_qty=70,
            delivery_days=3,
            production_capacity_per_day=40,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
            description="Minimalist clay planter pots with natural textured surface. Breathable clay promotes healthy root growth for indoor and outdoor flora.",
            craft_type="Studio Pottery",
            rating=4.7,
            stock=450,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-004",
            name="Traditional Low-Capacity Earthen Pots",
            artisan_name="Tanjore Clayware (Artisan B)",
            is_verified_artisan=True,
            location="Thanjavur, Tamil Nadu",
            category="Pottery",
            price=2450.0,
            price_per_unit=35.0,
            min_order_qty=20,
            delivery_days=2,
            production_capacity_per_day=20,
            shipping_days=0,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
            description="Traditional earthen pots with stock=0, capacity=20/day, shipping=0 days. Fully capable of producing 35 units in 2 days (20x2=40).",
            craft_type="Traditional Earthenware",
            rating=4.8,
            stock=0,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-005",
            name="Handwoven Pochampally Ikkat Silk Saree",
            artisan_name="Weavers Co-op Society",
            is_verified_artisan=True,
            location="Bhoodan Pochampally, Telangana",
            category="Handloom",
            price=8500.0,
            price_per_unit=8500.0,
            min_order_qty=1,
            delivery_days=4,
            production_capacity_per_day=2,
            shipping_days=2,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
            description="GI-tagged authentic Pochampally Ikkat pure mulberry silk saree. Geometrically tied-and-dyed yarn woven meticulously on traditional handlooms.",
            craft_type="Ikkat Silk Weaving",
            rating=5.0,
            stock=25,
            is_favorite=True,
        ),
        ProductItem(
            id="prod-006",
            name="Handcrafted Moradabad Brass Diya Lamps",
            artisan_name="Brass Heritage Craft",
            is_verified_artisan=True,
            location="Moradabad, Uttar Pradesh",
            category="Home Décor",
            price=1850.0,
            price_per_unit=185.0,
            min_order_qty=10,
            delivery_days=3,
            production_capacity_per_day=15,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1605371924599-2d0365da1ae0?auto=format&fit=crop&w=800&q=80",
            description="Solid brass oil lamps with intricately engraved peacock handles. Cast using the lost-wax technique by Moradabad brassware specialists.",
            craft_type="Brass Casting",
            rating=4.9,
            stock=150,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-007",
            name="Handloom Macrame Wall Hanging",
            artisan_name="Kala Kendra Weavers",
            is_verified_artisan=True,
            location="Kutch, Gujarat",
            category="Home Décor",
            price=1450.0,
            price_per_unit=290.0,
            min_order_qty=5,
            delivery_days=2,
            production_capacity_per_day=10,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1528458876861-544fd1761a91?auto=format&fit=crop&w=800&q=80",
            description="Artisanal cotton cord wall hanging tied on natural driftwood. Adds bohemian warmth and texture to interior spaces.",
            craft_type="Macrame & Textile Weaving",
            rating=4.6,
            stock=80,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-008",
            name="Woven Bamboo Storage Baskets (Set of 3)",
            artisan_name="Assam Bamboo Craft",
            is_verified_artisan=True,
            location="Majuli, Assam",
            category="Bamboo",
            price=1650.0,
            price_per_unit=550.0,
            min_order_qty=3,
            delivery_days=5,
            production_capacity_per_day=12,
            shipping_days=2,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
            description="Lightweight yet sturdy storage baskets hand-braided from natural golden bamboo. Eco-friendly, sustainable, and biodegradable.",
            craft_type="Bamboo Weaving",
            rating=4.8,
            stock=120,
            is_favorite=False,
        ),
        ProductItem(
            id="prod-009",
            name="Blue Pottery Decorative Flower Vase",
            artisan_name="Jaipur Blue Pottery Guild",
            is_verified_artisan=True,
            location="Jaipur, Rajasthan",
            category="Home Décor",
            price=2400.0,
            price_per_unit=1200.0,
            min_order_qty=2,
            delivery_days=4,
            production_capacity_per_day=5,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
            description="Turquoise blue quartz glazed ceramic vase crafted without clay. Hand-painted with Persian indigo motifs by traditional Jaipur craftsmen.",
            craft_type="Blue Pottery",
            rating=4.9,
            stock=40,
            is_favorite=True,
        ),
        ProductItem(
            id="prod-010",
            name="Handcrafted Wooden Kathputli Puppets",
            artisan_name="Marwar Folk Craft",
            is_verified_artisan=True,
            location="Jodhpur, Rajasthan",
            category="Woodcraft",
            price=950.0,
            price_per_unit=95.0,
            min_order_qty=10,
            delivery_days=3,
            production_capacity_per_day=20,
            shipping_days=1,
            lead_time_days=0,
            image_url="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
            description="Authentic Rajasthani string puppets carved from light mango wood and adorned in vivid bandhani textile attire.",
            craft_type="Wood Carving & Puppetry",
            rating=4.7,
            stock=90,
            is_favorite=False,
        ),
    ]

    @classmethod
    async def get_all_products(cls) -> List[ProductItem]:
        """Returns all products from persistent ChromaDB vector storage (falling back to seed if uninitialized/error)."""
        try:
            products = await ChromaRepository.get_all_products()
            if products:
                return products
        except Exception:
            pass
        return cls._PRODUCTS_SEED

    @classmethod
    async def get_product_by_id(cls, product_id: str) -> Optional[ProductItem]:
        """Finds product by unique ID from persistent ChromaDB vector storage."""
        try:
            prod = await ChromaRepository.get_product_by_id(product_id)
            if prod is not None:
                return prod
        except Exception:
            pass
        for p in cls._PRODUCTS_SEED:
            if p.id == product_id:
                return p
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
        for p in cls._PRODUCTS_SEED:
            if p.id == product_id:
                p.is_favorite = not p.is_favorite
                return p
        return None

=======
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
>>>>>>> 26359b1df17ecfad1d96b0aa72b4eea6309703e9
