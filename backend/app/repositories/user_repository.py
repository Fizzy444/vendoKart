import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from app.core.database import db_state, get_database
from app.models.user import UserInDB

logger = logging.getLogger("artisan.repository.user")

# In-memory fallback cache when MongoDB is offline / disconnected
_in_memory_users: Dict[str, Dict[str, Any]] = {}


class UserRepository:
    @staticmethod
    def _get_collection():
        db = get_database()
        return db.users

    @classmethod
    async def get_by_id(cls, user_id: str) -> Optional[UserInDB]:
        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
                doc = await collection.find_one(query)
                if not doc:
                    doc = await collection.find_one({"_id": user_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return UserInDB(**doc)
            except Exception as e:
                logger.warning(f"MongoDB error in get_by_id: {e}")

        # In-memory store
        for doc in _in_memory_users.values():
            if str(doc.get("_id")) == str(user_id) or str(doc.get("id")) == str(user_id):
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return UserInDB(**doc_copy)
        return None

    @classmethod
    async def get_by_phone(cls, phone: str) -> Optional[UserInDB]:
        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                doc = await collection.find_one({"phone": phone})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return UserInDB(**doc)
            except Exception as e:
                logger.warning(f"MongoDB error in get_by_phone: {e}")

        # In-memory store
        for doc in _in_memory_users.values():
            if doc.get("phone") == phone:
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return UserInDB(**doc_copy)
        return None

    @classmethod
    async def create(cls, user_data: Dict[str, Any]) -> UserInDB:
        now = datetime.now(timezone.utc)
        user_data["created_at"] = now
        user_data["updated_at"] = now

        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                insert_result = await collection.insert_one(user_data)
                user_data["_id"] = str(insert_result.inserted_id)
                _in_memory_users[user_data["_id"]] = dict(user_data)
                return UserInDB(**user_data)
            except Exception as e:
                logger.warning(f"MongoDB error in create: {e}")

        # In-memory store
        new_id = str(uuid.uuid4())
        user_data["_id"] = new_id
        _in_memory_users[new_id] = dict(user_data)
        return UserInDB(**user_data)

    @classmethod
    async def update(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[UserInDB]:
        update_data["updated_at"] = datetime.now(timezone.utc)

        if db_state.is_mongo_online:
            try:
                collection = cls._get_collection()
                query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
                result = await collection.find_one_and_update(
                    query,
                    {"$set": update_data},
                    return_document=True,
                )
                if not result:
                    result = await collection.find_one_and_update(
                        {"_id": user_id},
                        {"$set": update_data},
                        return_document=True,
                    )
                if result:
                    result["_id"] = str(result["_id"])
                    _in_memory_users[result["_id"]] = dict(result)
                    return UserInDB(**result)
            except Exception as e:
                logger.warning(f"MongoDB error in update: {e}")

        # In-memory store
        for doc in _in_memory_users.values():
            if str(doc.get("_id")) == str(user_id) or str(doc.get("id")) == str(user_id):
                doc.update(update_data)
                doc_copy = dict(doc)
                doc_copy["_id"] = str(doc_copy["_id"])
                return UserInDB(**doc_copy)
        return None
