from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class UserRole(str, Enum):
    SELLER = "seller"
    BUYER = "buyer"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class Location(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class UserInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None
    business_name: Optional[str] = None
    roles: List[UserRole] = [UserRole.BUYER]
    status: UserStatus = UserStatus.ACTIVE
    is_phone_verified: bool = True
    location: Optional[Location] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)
