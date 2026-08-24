import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from bson import ObjectId
from app.core.database import get_database
from app.models.user import UserInDB

logger = logging.getLogger("artisan.repository.user")


class UserRepository:
    @staticmethod
    def _get_collection():
        db = get_database()
        return db.users

    @classmethod
    async def get_by_id(cls, user_id: str) -> Optional[UserInDB]:
        collection = cls._get_collection()
        try:
            query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        except Exception:
            query = {"_id": user_id}

        doc = await collection.find_one(query)
        if not doc:
            # Also try string id if stored that way
            doc = await collection.find_one({"_id": user_id})
        if not doc:
            return None

        # Format id for Pydantic
        doc["_id"] = str(doc["_id"])
        return UserInDB(**doc)

    @classmethod
    async def get_by_phone(cls, phone: str) -> Optional[UserInDB]:
        collection = cls._get_collection()
        doc = await collection.find_one({"phone": phone})
        if not doc:
            return None
        doc["_id"] = str(doc["_id"])
        return UserInDB(**doc)

    @classmethod
    async def create(cls, user_data: Dict[str, Any]) -> UserInDB:
        collection = cls._get_collection()
        now = datetime.now(timezone.utc)
        user_data["created_at"] = now
        user_data["updated_at"] = now
        
        insert_result = await collection.insert_one(user_data)
        user_data["_id"] = str(insert_result.inserted_id)
        return UserInDB(**user_data)

    @classmethod
    async def update(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[UserInDB]:
        collection = cls._get_collection()
        update_data["updated_at"] = datetime.now(timezone.utc)

        try:
            query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        except Exception:
            query = {"_id": user_id}

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

        if not result:
            return None

        result["_id"] = str(result["_id"])
        return UserInDB(**result)
