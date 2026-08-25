import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from app.core.database import db_state
from app.models.seller import SellerProfileInDB, SellerProfileModel

logger = logging.getLogger("artisan.repository.seller")


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


class SellerRepository:
    @classmethod
    async def get_by_id(cls, seller_id: str) -> Optional[SellerProfileInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(SellerProfileModel).where(SellerProfileModel.id == str(seller_id))
                result = await session.execute(stmt)
                seller_model = result.scalar_one_or_none()
                if not seller_model:
                    stmt_user = select(SellerProfileModel).where(SellerProfileModel.user_id == str(seller_id))
                    result_user = await session.execute(stmt_user)
                    seller_model = result_user.scalar_one_or_none()
                if seller_model:
                    return seller_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in seller get_by_id: {e}")
        return None

    @classmethod
    async def get_by_user_id(cls, user_id: str) -> Optional[SellerProfileInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(SellerProfileModel).where(SellerProfileModel.user_id == str(user_id))
                result = await session.execute(stmt)
                seller_model = result.scalar_one_or_none()
                if seller_model:
                    return seller_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in seller get_by_user_id: {e}")
        return None

    @classmethod
    async def create(cls, seller_data: Dict[str, Any]) -> SellerProfileInDB:
        now = datetime.now(timezone.utc)
        seller_id = str(seller_data.get("_id") or seller_data.get("id") or uuid.uuid4())

        craft_cat = seller_data.get("craft_category", "Other Craft")
        if hasattr(craft_cat, "value"):
            craft_cat = craft_cat.value

        seller_type = seller_data.get("seller_type", "individual_artisan")
        if hasattr(seller_type, "value"):
            seller_type = seller_type.value

        workspace_type = seller_data.get("workspace_type", "home_workshop")
        if hasattr(workspace_type, "value"):
            workspace_type = workspace_type.value

        loc_raw = seller_data.get("location")
        loc = _sanitize_json(loc_raw)

        lat = seller_data.get("latitude")
        lon = seller_data.get("longitude")
        address = seller_data.get("address")
        city = seller_data.get("city")
        district = seller_data.get("district")
        state = seller_data.get("state")
        pincode = seller_data.get("pincode")

        if isinstance(loc, dict):
            if lat is None:
                lat = loc.get("latitude")
            if lon is None:
                lon = loc.get("longitude")
            if address is None:
                address = loc.get("address")
            if city is None:
                city = loc.get("city")
            if district is None:
                district = loc.get("district")
            if state is None:
                state = loc.get("state")
            if pincode is None:
                pincode = loc.get("pincode")

        seller_model = SellerProfileModel(
            id=seller_id,
            user_id=str(seller_data["user_id"]),
            phone=seller_data.get("phone", ""),
            artisan_name=seller_data.get("artisan_name"),
            business_name=seller_data.get("business_name"),
            bio=seller_data.get("bio"),
            craft_category=craft_cat,
            craft_specialties=_sanitize_json(seller_data.get("craft_specialties", [])),
            experience_years=int(seller_data.get("experience_years", 1)),
            seller_type=seller_type,
            workspace_type=workspace_type,
            number_of_workers=int(seller_data.get("number_of_workers", 1)),
            daily_labour_rate_inr=float(seller_data.get("daily_labour_rate_inr", 400.0)),
            daily_capacity_units=int(seller_data.get("daily_capacity_units", 5)),
            lead_time_days=int(seller_data.get("lead_time_days", 3)),
            latitude=float(lat) if lat is not None else None,
            longitude=float(lon) if lon is not None else None,
            address=address,
            city=city,
            district=district,
            state=state,
            pincode=pincode,
            location=loc,
            workspace_photos=_sanitize_json(seller_data.get("workspace_photos", [])),
            verification_status=seller_data.get("verification_status", "pending"),
            trust_score=float(seller_data.get("trust_score", 60.0)),
            is_onboarded=bool(seller_data.get("is_onboarded", False)),
            created_at=seller_data.get("created_at", now),
            updated_at=seller_data.get("updated_at", now),
        )

        async with db_state.session_factory() as session:
            session.add(seller_model)
            await session.commit()
            await session.refresh(seller_model)
            return seller_model.to_pydantic()

    @classmethod
    async def update(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[SellerProfileInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(SellerProfileModel).where(
                    (SellerProfileModel.user_id == str(user_id)) | (SellerProfileModel.id == str(user_id))
                )
                result = await session.execute(stmt)
                seller_model = result.scalar_one_or_none()
                if not seller_model:
                    return None

                for k, v in update_data.items():
                    if k in ("_id", "id", "user_id"):
                        continue
                    if k == "craft_category" and hasattr(v, "value"):
                        v = v.value
                    elif k == "seller_type" and hasattr(v, "value"):
                        v = v.value
                    elif k == "workspace_type" and hasattr(v, "value"):
                        v = v.value
                    elif k == "location":
                        v = _sanitize_json(v)
                        if isinstance(v, dict):
                            if "latitude" in v and v["latitude"] is not None:
                                seller_model.latitude = float(v["latitude"])
                            if "longitude" in v and v["longitude"] is not None:
                                seller_model.longitude = float(v["longitude"])
                            if "address" in v and v["address"] is not None:
                                seller_model.address = v["address"]
                            if "city" in v and v["city"] is not None:
                                seller_model.city = v["city"]
                            if "district" in v and v["district"] is not None:
                                seller_model.district = v["district"]
                            if "state" in v and v["state"] is not None:
                                seller_model.state = v["state"]
                            if "pincode" in v and v["pincode"] is not None:
                                seller_model.pincode = v["pincode"]
                    elif k in ("workspace_photos", "craft_specialties"):
                        v = _sanitize_json(v)
                    elif k == "latitude" and v is not None:
                        v = float(v)
                    elif k == "longitude" and v is not None:
                        v = float(v)

                    if hasattr(seller_model, k):
                        setattr(seller_model, k, v)

                seller_model.updated_at = datetime.now(timezone.utc)
                await session.commit()
                await session.refresh(seller_model)
                return seller_model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in seller update: {e}")
        return None

    @classmethod
    async def list_verified(cls, skip: int = 0, limit: int = 20) -> List[SellerProfileInDB]:
        if not db_state.session_factory:
            return []
        try:
            async with db_state.session_factory() as session:
                stmt = (
                    select(SellerProfileModel)
                    .where(SellerProfileModel.is_onboarded == True)
                    .offset(skip)
                    .limit(limit)
                )
                result = await session.execute(stmt)
                models = result.scalars().all()
                return [m.to_pydantic() for m in models]
        except Exception as e:
            logger.warning(f"Database error in seller list_verified: {e}")
            return []
