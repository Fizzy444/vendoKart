from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.user import Location, UserRole, UserStatus


class OTPRequest(BaseModel):
    phone: str = Field(..., description="Phone number with country code, e.g. +919876543210")


class OTPResponse(BaseModel):
    message: str
    phone: str


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str
    role: Optional[UserRole] = UserRole.BUYER
    name: Optional[str] = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    location: Optional[Location] = None
    roles: Optional[List[UserRole]] = None


class UserResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    business_name: Optional[str] = None
    roles: List[UserRole]
    status: UserStatus
    is_phone_verified: bool
    location: Optional[Location] = None
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenPair
