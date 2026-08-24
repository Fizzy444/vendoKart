import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from app.core.database import db_state, get_database
from app.models.seller import SellerProfileInDB

logger = logging.getLogger("artisan.repository.seller")

# In-memory fallback cache when MongoDB is offline
_in_memory_sellers: Dict[str, Dict[str, Any]] = {}


class SellerRepository:
    @staticmethod
    def _get_collection():
        db = get_database()
        return db.sellers

    @classmethod
    async def get_by_id(cls, seller_id: str) -> Optional[SellerProfileInDB]:
        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                query = {"_id": ObjectId(seller_id)} if ObjectId.is_valid(seller_id) else {"_id": seller_id}
                doc = await collection.find_one(query)
                if not doc:
                    doc = await collection.find_one({"_id": seller_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return SellerProfileInDB(**doc)
            except Exception as e:
                logger.warning(f"MongoDB error in seller get_by_id: {e}")

        # In-memory store
        for doc in _in_memory_sellers.values():
            if str(doc.get("_id")) == str(seller_id) or str(doc.get("id")) == str(seller_id):
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return SellerProfileInDB(**doc_copy)
        return None

    @classmethod
    async def get_by_user_id(cls, user_id: str) -> Optional[SellerProfileInDB]:
        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                doc = await collection.find_one({"user_id": user_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return SellerProfileInDB(**doc)
            except Exception as e:
                logger.warning(f"MongoDB error in seller get_by_user_id: {e}")

        # In-memory store
        for doc in _in_memory_sellers.values():
            if str(doc.get("user_id")) == str(user_id):
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return SellerProfileInDB(**doc_copy)
        return None

    @classmethod
    async def create(cls, seller_data: Dict[str, Any]) -> SellerProfileInDB:
        now = datetime.now(timezone.utc)
        seller_data["created_at"] = now
        seller_data["updated_at"] = now

        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                insert_result = await collection.insert_one(seller_data)
                seller_data["_id"] = str(insert_result.inserted_id)
                _in_memory_sellers[seller_data["_id"]] = dict(seller_data)
                return SellerProfileInDB(**seller_data)
            except Exception as e:
                logger.warning(f"MongoDB error in seller create: {e}")

        new_id = str(uuid.uuid4())
        seller_data["_id"] = new_id
        _in_memory_sellers[new_id] = dict(seller_data)
        return SellerProfileInDB(**seller_data)

    @classmethod
    async def update(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[SellerProfileInDB]:
        update_data["updated_at"] = datetime.now(timezone.utc)

        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                result = await collection.find_one_and_update(
                    {"user_id": user_id},
                    {"$set": update_data},
                    return_document=True,
                )
                if not result:
                    try:
                        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
                        result = await collection.find_one_and_update(
                            query,
                            {"$set": update_data},
                            return_document=True,
                        )
                    except Exception:
                        pass
                if result:
                    result["_id"] = str(result["_id"])
                    _in_memory_sellers[result["_id"]] = dict(result)
                    return SellerProfileInDB(**result)
            except Exception as e:
                logger.warning(f"MongoDB error in seller update: {e}")

        # In-memory store
        for doc in _in_memory_sellers.values():
            if str(doc.get("user_id")) == str(user_id) or str(doc.get("_id")) == str(user_id):
                doc.update(update_data)
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return SellerProfileInDB(**doc_copy)
        return None

    @classmethod
    async def list_verified(cls, skip: int = 0, limit: int = 20) -> List[SellerProfileInDB]:
        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                cursor = collection.find({"is_onboarded": True}).skip(skip).limit(limit)
                results = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(SellerProfileInDB(**doc))
                if results:
                    return results
            except Exception as e:
                logger.warning(f"MongoDB error in seller list_verified: {e}")

        results = []
        for doc in list(_in_memory_sellers.values())[skip : skip + limit]:
            if doc.get("is_onboarded", False):
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                results.append(SellerProfileInDB(**doc_copy))
        return results
