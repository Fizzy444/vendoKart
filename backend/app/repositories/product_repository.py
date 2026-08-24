import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database, is_mongo_online
from app.models.product import ProductInDB, ProductStatus

# Fast in-memory fallback store for offline dev & test resilience
_in_memory_products: Dict[str, Dict[str, Any]] = {}


class ProductRepository:
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self._db = db

    def _get_collection(self):
        db = self._db if self._db is not None else get_database()
        if db is not None and is_mongo_online():
            return db.products
        return None

    async def create(self, product: ProductInDB) -> ProductInDB:
        doc = product.model_dump(by_alias=True)
        collection = self._get_collection()
        if collection is not None:
            try:
                await collection.insert_one(doc)
            except Exception as e:
                print(f"[ProductRepository] Mongo offline, saving in-memory: {e}")
                _in_memory_products[product.id] = doc
        else:
            _in_memory_products[product.id] = doc
        return product

    async def get_by_id(self, product_id: str) -> Optional[ProductInDB]:
        collection = self._get_collection()
        if collection is not None:
            try:
                doc = await collection.find_one({"_id": product_id})
                if doc:
                    return ProductInDB(**doc)
            except Exception as e:
                print(f"[ProductRepository] Mongo query error: {e}")
        doc = _in_memory_products.get(product_id)
        return ProductInDB(**doc) if doc else None

    async def list_by_seller(self, seller_id: str) -> List[ProductInDB]:
        collection = self._get_collection()
        products = []
        if collection is not None:
            try:
                cursor = collection.find({"seller_id": seller_id}).sort("created_at", -1)
                async for doc in cursor:
                    products.append(ProductInDB(**doc))
                return products
            except Exception as e:
                print(f"[ProductRepository] Mongo list error: {e}")
        
        # In-memory fallback
        for doc in _in_memory_products.values():
            if doc.get("seller_id") == seller_id:
                products.append(ProductInDB(**doc))
        products.sort(key=lambda p: p.created_at, reverse=True)
        return products

    async def list_published(self, limit: int = 50, category: Optional[str] = None) -> List[ProductInDB]:
        collection = self._get_collection()
        query: Dict[str, Any] = {"status": ProductStatus.PUBLISHED.value}
        if category:
            query["craft_category"] = category
            
        products = []
        if collection is not None:
            try:
                cursor = collection.find(query).sort("created_at", -1).limit(limit)
                async for doc in cursor:
                    products.append(ProductInDB(**doc))
                return products
            except Exception as e:
                print(f"[ProductRepository] Mongo list error: {e}")
        
        # In-memory fallback
        for doc in _in_memory_products.values():
            if doc.get("status") == ProductStatus.PUBLISHED.value:
                if not category or doc.get("craft_category") == category:
                    products.append(ProductInDB(**doc))
        products.sort(key=lambda p: p.created_at, reverse=True)
        return products[:limit]

    async def update(self, product_id: str, update_data: Dict[str, Any]) -> Optional[ProductInDB]:
        update_data["updated_at"] = datetime.now(timezone.utc)
        collection = self._get_collection()
        if collection is not None:
            try:
                await collection.update_one({"_id": product_id}, {"$set": update_data})
                doc = await collection.find_one({"_id": product_id})
                if doc:
                    return ProductInDB(**doc)
            except Exception as e:
                print(f"[ProductRepository] Mongo update error: {e}")
        
        if product_id in _in_memory_products:
            _in_memory_products[product_id].update(update_data)
            return ProductInDB(**_in_memory_products[product_id])
        return None

    async def delete(self, product_id: str) -> bool:
        collection = self._get_collection()
        if collection is not None:
            try:
                res = await collection.delete_one({"_id": product_id})
                return res.deleted_count > 0
            except Exception as e:
                print(f"[ProductRepository] Mongo delete error: {e}")
        
        if product_id in _in_memory_products:
            del _in_memory_products[product_id]
            return True
        return False
