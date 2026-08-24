import logging
from typing import Optional
from fastapi import HTTPException, status
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import UserInDB, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.schemas.user import AuthResponse, TokenPair, UserProfileUpdate, UserResponse
from app.services.otp_service import OTPService

logger = logging.getLogger("artisan.service.auth")


class AuthService:
    @staticmethod
    def _to_user_response(user_db: UserInDB) -> UserResponse:
        return UserResponse(
            id=str(user_db.id),
            phone=user_db.phone,
            name=user_db.name,
            business_name=user_db.business_name,
            roles=user_db.roles,
            status=user_db.status,
            is_phone_verified=user_db.is_phone_verified,
            location=user_db.location,
            created_at=user_db.created_at,
            updated_at=user_db.updated_at,
        )

    @classmethod
    async def verify_otp_and_authenticate(
        cls,
        phone: str,
        otp: str,
        role: Optional[UserRole] = None,
        name: Optional[str] = None,
    ) -> AuthResponse:
        is_valid = await OTPService.verify_otp(phone, otp)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code",
            )

        assigned_role = role or UserRole.BUYER
        user_db = await UserRepository.get_by_phone(phone)

        if not user_db:
            # Auto-register new user
            new_user_data = {
                "phone": phone,
                "name": name,
                "roles": [assigned_role],
                "status": UserStatus.ACTIVE,
                "is_phone_verified": True,
            }
            user_db = await UserRepository.create(new_user_data)
            logger.info(f"Created new user with phone {phone} and role {assigned_role}")
        else:
            # Existing user: update roles or name if necessary
            update_fields = {}
            roles_set = set(user_db.roles)
            if assigned_role not in roles_set:
                roles_set.add(assigned_role)
                update_fields["roles"] = list(roles_set)

            if name and (not user_db.name or user_db.name != name):
                update_fields["name"] = name

            if update_fields:
                updated = await UserRepository.update(user_db.id, update_fields)
                if updated:
                    user_db = updated

        # Generate tokens
        role_strings = [r.value if hasattr(r, "value") else str(r) for r in user_db.roles]
        access_token = create_access_token(subject=user_db.id, roles=role_strings)
        refresh_token = create_refresh_token(subject=user_db.id)

        user_response = cls._to_user_response(user_db)
        tokens = TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

        return AuthResponse(user=user_response, tokens=tokens)

    @classmethod
    async def refresh_tokens(cls, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user_db = await UserRepository.get_by_id(user_id)
        if not user_db or user_db.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or does not exist",
            )

        role_strings = [r.value if hasattr(r, "value") else str(r) for r in user_db.roles]
        new_access_token = create_access_token(subject=user_db.id, roles=role_strings)
        new_refresh_token = create_refresh_token(subject=user_db.id)

        return TokenPair(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[UserResponse]:
        user_db = await UserRepository.get_by_id(user_id)
        if not user_db:
            return None
        return cls._to_user_response(user_db)

    @classmethod
    async def update_profile(
        cls,
        user_id: str,
        update_data: UserProfileUpdate,
    ) -> UserResponse:
        data_dict = update_data.model_dump(exclude_unset=True)
        if not data_dict:
            user_db = await UserRepository.get_by_id(user_id)
            if not user_db:
                raise HTTPException(status_code=404, detail="User not found")
            return cls._to_user_response(user_db)

        updated_user = await UserRepository.update(user_id, data_dict)
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        return cls._to_user_response(updated_user)
