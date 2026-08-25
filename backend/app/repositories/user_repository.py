import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import select
from app.core.database import db_state
from app.models.user import UserInDB, UserModel

logger = logging.getLogger("artisan.repository.user")


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


class UserRepository:
    @classmethod
    async def get_by_id(cls, user_id: str) -> Optional[UserInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(UserModel).where(UserModel.id == str(user_id))
                result = await session.execute(stmt)
                user_model = result.scalar_one_or_none()
                if user_model:
                    return user_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in user get_by_id: {e}")
        return None

    @classmethod
    async def get_by_phone(cls, phone: str) -> Optional[UserInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(UserModel).where(UserModel.phone == phone)
                result = await session.execute(stmt)
                user_model = result.scalar_one_or_none()
                if user_model:
                    return user_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in user get_by_phone: {e}")
        return None

    @classmethod
    async def create(cls, user_data: Dict[str, Any]) -> UserInDB:
        now = datetime.now(timezone.utc)
        user_id = str(user_data.get("_id") or user_data.get("id") or uuid.uuid4())

        roles_raw = user_data.get("roles", ["buyer"])
        roles = [r.value if hasattr(r, "value") else str(r) for r in roles_raw]

        status_val = user_data.get("status", "active")
        status = status_val.value if hasattr(status_val, "value") else str(status_val)

        loc_raw = user_data.get("location")
        loc_data = _sanitize_json(loc_raw)

        lat = user_data.get("latitude")
        lon = user_data.get("longitude")
        city = user_data.get("city")
        state = user_data.get("state")
        pincode = user_data.get("pincode")

        if isinstance(loc_data, dict):
            if lat is None:
                lat = loc_data.get("latitude")
            if lon is None:
                lon = loc_data.get("longitude")
            if city is None:
                city = loc_data.get("city")
            if state is None:
                state = loc_data.get("state")
            if pincode is None:
                pincode = loc_data.get("pincode")

        user_model = UserModel(
            id=user_id,
            phone=user_data["phone"],
            name=user_data.get("name"),
            business_name=user_data.get("business_name"),
            roles=roles,
            status=status,
            is_phone_verified=user_data.get("is_phone_verified", True),
            latitude=float(lat) if lat is not None else None,
            longitude=float(lon) if lon is not None else None,
            city=city,
            state=state,
            pincode=pincode,
            location=loc_data,
            created_at=user_data.get("created_at", now),
            updated_at=user_data.get("updated_at", now),
        )

        async with db_state.session_factory() as session:
            session.add(user_model)
            await session.commit()
            await session.refresh(user_model)
            return user_model.to_pydantic()

    @classmethod
    async def update(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[UserInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(UserModel).where(UserModel.id == str(user_id))
                result = await session.execute(stmt)
                user_model = result.scalar_one_or_none()
                if not user_model:
                    return None

                for k, v in update_data.items():
                    if k in ("_id", "id"):
                        continue
                    if k == "roles" and isinstance(v, list):
                        v = [r.value if hasattr(r, "value") else str(r) for r in v]
                    elif k == "status" and hasattr(v, "value"):
                        v = v.value
                    elif k == "location":
                        v = _sanitize_json(v)
                        if isinstance(v, dict):
                            if "latitude" in v and v["latitude"] is not None:
                                user_model.latitude = float(v["latitude"])
                            if "longitude" in v and v["longitude"] is not None:
                                user_model.longitude = float(v["longitude"])
                            if "city" in v and v["city"] is not None:
                                user_model.city = v["city"]
                            if "state" in v and v["state"] is not None:
                                user_model.state = v["state"]
                            if "pincode" in v and v["pincode"] is not None:
                                user_model.pincode = v["pincode"]
                    elif k == "latitude" and v is not None:
                        v = float(v)
                    elif k == "longitude" and v is not None:
                        v = float(v)

                    if hasattr(user_model, k):
                        setattr(user_model, k, v)

                user_model.updated_at = datetime.now(timezone.utc)
                await session.commit()
                await session.refresh(user_model)
                return user_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in user update: {e}")
        return None
