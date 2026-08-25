import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from app.models.seller import CraftCategory, SellerLocation, SellerProfileInDB, SellerType, WorkspaceType
from app.models.user import UserInDB
from app.repositories.seller_repository import SellerRepository
from app.repositories.user_repository import UserRepository
from app.schemas.seller import (
    SellerLocationUpdate,
    SellerProfileCreate,
    SellerProfileResponse,
    SellerProfileUpdate,
    SellerPublicResponse,
)

logger = logging.getLogger("artisan.service.seller")


class SellerService:
    @staticmethod
    def _to_profile_response(seller_db: SellerProfileInDB) -> SellerProfileResponse:
        return SellerProfileResponse(
            id=str(seller_db.id),
            user_id=seller_db.user_id,
            phone=seller_db.phone,
            artisan_name=seller_db.artisan_name,
            business_name=seller_db.business_name,
            bio=seller_db.bio,
            craft_category=seller_db.craft_category,
            craft_specialties=seller_db.craft_specialties,
            experience_years=seller_db.experience_years,
            seller_type=seller_db.seller_type,
            workspace_type=seller_db.workspace_type,
            number_of_workers=seller_db.number_of_workers,
            daily_labour_rate_inr=seller_db.daily_labour_rate_inr,
            daily_capacity_units=seller_db.daily_capacity_units,
            lead_time_days=seller_db.lead_time_days,
            location=seller_db.location,
            workspace_photos=seller_db.workspace_photos,
            verification_status=seller_db.verification_status,
            trust_score=seller_db.trust_score,
            is_onboarded=seller_db.is_onboarded,
            created_at=seller_db.created_at,
            updated_at=seller_db.updated_at,
        )

    @staticmethod
    def _to_public_response(seller_db: SellerProfileInDB) -> SellerPublicResponse:
        city = seller_db.location.city if seller_db.location else None
        state = seller_db.location.state if seller_db.location else None
        return SellerPublicResponse(
            id=str(seller_db.id),
            artisan_name=seller_db.artisan_name,
            business_name=seller_db.business_name,
            bio=seller_db.bio,
            craft_category=seller_db.craft_category,
            craft_specialties=seller_db.craft_specialties,
            experience_years=seller_db.experience_years,
            seller_type=seller_db.seller_type,
            daily_capacity_units=seller_db.daily_capacity_units,
            lead_time_days=seller_db.lead_time_days,
            city=city,
            state=state,
            verification_status=seller_db.verification_status,
            trust_score=seller_db.trust_score,
        )

    @classmethod
    async def get_or_create_profile(cls, user: UserInDB) -> SellerProfileResponse:
        seller_db = await SellerRepository.get_by_user_id(str(user.id))
        if seller_db:
            return cls._to_profile_response(seller_db)

        # Create initial default seller profile for the user
        initial_data = {
            "user_id": str(user.id),
            "phone": user.phone,
            "artisan_name": user.name or "Master Artisan",
            "business_name": user.business_name or (f"{user.name}'s Studio" if user.name else "Artisan Studio"),
            "craft_category": CraftCategory.OTHER.value,
            "craft_specialties": [],
            "experience_years": 1,
            "seller_type": SellerType.INDIVIDUAL.value,
            "workspace_type": WorkspaceType.HOME_WORKSHOP.value,
            "number_of_workers": 1,
            "daily_labour_rate_inr": 400.0,
            "daily_capacity_units": 5,
            "lead_time_days": 3,
            "verification_status": "verified" if user.is_phone_verified else "pending",
            "trust_score": 70.0 if user.is_phone_verified else 50.0,
            "is_onboarded": False,
        }

        if user.location:
            initial_data["location"] = user.location.model_dump()
            initial_data["latitude"] = user.location.latitude
            initial_data["longitude"] = user.location.longitude

        new_seller = await SellerRepository.create(initial_data)
        logger.info(f"Initialized seller profile for user_id={user.id}")
        return cls._to_profile_response(new_seller)

    @classmethod
    async def get_profile_by_user_id(cls, user_id: str) -> Optional[SellerProfileResponse]:
        seller_db = await SellerRepository.get_by_user_id(user_id)
        if not seller_db:
            return None
        return cls._to_profile_response(seller_db)

    @classmethod
    async def get_public_profile(cls, seller_id: str) -> SellerPublicResponse:
        seller_db = await SellerRepository.get_by_id(seller_id)
        if not seller_db:
            # Also try by user_id
            seller_db = await SellerRepository.get_by_user_id(seller_id)
        if not seller_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller profile not found",
            )
        return cls._to_public_response(seller_db)

    @classmethod
    async def update_profile(
        cls,
        user: UserInDB,
        update_data: SellerProfileUpdate,
    ) -> SellerProfileResponse:
        user_id = str(user.id)
        existing = await SellerRepository.get_by_user_id(user_id)
        if not existing:
            # Create first
            await cls.get_or_create_profile(user)

        data_dict = update_data.model_dump(exclude_unset=True)

        # Handle enum serialization if present
        if "craft_category" in data_dict and hasattr(data_dict["craft_category"], "value"):
            data_dict["craft_category"] = data_dict["craft_category"].value
        if "seller_type" in data_dict and hasattr(data_dict["seller_type"], "value"):
            data_dict["seller_type"] = data_dict["seller_type"].value
        if "workspace_type" in data_dict and hasattr(data_dict["workspace_type"], "value"):
            data_dict["workspace_type"] = data_dict["workspace_type"].value

        # Calculate trust score bump upon onboarding
        if data_dict.get("is_onboarded") or (data_dict.get("artisan_name") and data_dict.get("craft_category")):
            data_dict["is_onboarded"] = True
            data_dict["trust_score"] = max(existing.trust_score if existing else 70.0, 85.0)

        # Also sync name/business_name/location/coords back to user record
        user_sync = {}
        if "artisan_name" in data_dict and data_dict["artisan_name"]:
            user_sync["name"] = data_dict["artisan_name"]
        if "business_name" in data_dict and data_dict["business_name"]:
            user_sync["business_name"] = data_dict["business_name"]
        if "location" in data_dict and data_dict["location"]:
            loc_val = data_dict["location"]
            if hasattr(loc_val, "model_dump"):
                loc_val = loc_val.model_dump()
            if isinstance(loc_val, dict):
                data_dict["latitude"] = loc_val.get("latitude")
                data_dict["longitude"] = loc_val.get("longitude")
                user_sync["location"] = loc_val
                user_sync["latitude"] = loc_val.get("latitude")
                user_sync["longitude"] = loc_val.get("longitude")
        if user_sync:
            await UserRepository.update(user_id, user_sync)

        updated_seller = await SellerRepository.update(user_id, data_dict)
        if not updated_seller:
            raise HTTPException(status_code=500, detail="Failed to update seller profile")

        logger.info(f"Updated seller profile for user_id={user_id}")
        return cls._to_profile_response(updated_seller)

    @classmethod
    async def update_location(
        cls,
        user: UserInDB,
        location_data: SellerLocationUpdate,
    ) -> SellerProfileResponse:
        user_id = str(user.id)
        existing = await SellerRepository.get_by_user_id(user_id)
        if not existing:
            await cls.get_or_create_profile(user)

        loc_dict = location_data.model_dump(exclude_unset=True)
        loc_dict["captured_at"] = datetime.now(timezone.utc).isoformat()

        update_dict = {
            "location": loc_dict,
            "latitude": location_data.latitude,
            "longitude": location_data.longitude,
            "address": location_data.address,
            "city": location_data.city,
            "district": location_data.district,
            "state": location_data.state,
            "pincode": location_data.pincode,
        }

        # Also update user's location & coordinates
        await UserRepository.update(user_id, {
            "location": loc_dict,
            "latitude": location_data.latitude,
            "longitude": location_data.longitude,
            "city": location_data.city,
            "state": location_data.state,
            "pincode": location_data.pincode,
        })

        updated_seller = await SellerRepository.update(user_id, update_dict)
        if not updated_seller:
            raise HTTPException(status_code=500, detail="Failed to update location")

        logger.info(f"Updated seller location for user_id={user_id}")
        return cls._to_profile_response(updated_seller)

    @classmethod
    async def list_sellers(cls, skip: int = 0, limit: int = 20) -> List[SellerPublicResponse]:
        sellers = await SellerRepository.list_verified(skip=skip, limit=limit)
        return [cls._to_public_response(s) for s in sellers]
