import logging
from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_active_user, require_role
from app.models.user import UserRole
from app.schemas.response import GenericResponse
from app.schemas.user import (
    AuthResponse,
    FirebaseLoginRequest,
    OTPRequest,
    OTPResponse,
    OTPVerifyRequest,
    RefreshTokenRequest,
    TokenPair,
    UserProfileUpdate,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.otp_service import OTPService

logger = logging.getLogger("artisan.auth")
router = APIRouter()


@router.post("/firebase-login", response_model=AuthResponse)
async def firebase_login(request: FirebaseLoginRequest):
    """
    Authenticate or auto-register a user with a verified Firebase ID token.
    Issues JWT session tokens for the application.
    """
    auth_result = await AuthService.authenticate_with_firebase(
        id_token=request.id_token,
        phone=request.phone,
        role=request.role,
        name=request.name,
    )
    return auth_result


@router.post("/otp/send", response_model=OTPResponse)
async def send_otp(request: OTPRequest):
    """
    Send OTP code to the provided phone number.
    In development mode, returns the mock OTP code directly for convenience.
    """
    otp, is_dev = await OTPService.generate_otp(request.phone)
    return OTPResponse(
        message="OTP sent successfully",
        phone=request.phone,
        is_dev_mode=is_dev,
        dev_otp=otp if is_dev else None,
    )


@router.post("/otp/verify", response_model=AuthResponse)
async def verify_otp(request: OTPVerifyRequest):
    """
    Verify OTP code, auto-register or authenticate user, and issue JWT tokens.
    """
    auth_result = await AuthService.verify_otp_and_authenticate(
        phone=request.phone,
        otp=request.otp,
        role=request.role,
        name=request.name,
    )
    return auth_result


@router.post("/refresh", response_model=TokenPair)
async def refresh_access_token(request: RefreshTokenRequest):
    """
    Issue a new access token using a valid refresh token.
    """
    new_tokens = await AuthService.refresh_tokens(request.refresh_token)
    return new_tokens


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Get profile information of the currently authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserProfileUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Update profile details for the currently authenticated user.
    """
    updated = await AuthService.update_profile(current_user.id, update_data)
    return updated


@router.get("/seller-only", response_model=GenericResponse)
async def seller_protected_route(
    current_user: UserResponse = Depends(require_role([UserRole.SELLER])),
):
    """
    Example role-guarded route accessible exclusively to sellers (and admins).
    """
    return GenericResponse(
        message=f"Welcome artisan/seller {current_user.phone}! You have authorized access.",
        data={"user_id": current_user.id, "roles": [r.value for r in current_user.roles]},
    )


@router.get("/buyer-only", response_model=GenericResponse)
async def buyer_protected_route(
    current_user: UserResponse = Depends(require_role([UserRole.BUYER])),
):
    """
    Example role-guarded route accessible exclusively to buyers (and admins).
    """
    return GenericResponse(
        message=f"Welcome buyer {current_user.phone}! You have authorized access.",
        data={"user_id": current_user.id, "roles": [r.value for r in current_user.roles]},
    )


@router.post("/logout", response_model=GenericResponse)
async def logout(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Logout endpoint to notify session termination.
    """
    return GenericResponse(message="Successfully logged out.")
