import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


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
    business_name: Optional[str] = None
    roles: List[UserRole] = [UserRole.BUYER]
    status: UserStatus = UserStatus.ACTIVE
    is_phone_verified: bool = True
    location: Optional[Location] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    roles: Mapped[List[str]] = mapped_column(JSON, default=lambda: ["buyer"])
    status: Mapped[str] = mapped_column(String(32), default="active")
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Explicit coordinate and location columns for fast indexing and spatial lookup
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> UserInDB:
        role_enums = []
        for r in (self.roles or []):
            try:
                role_enums.append(UserRole(r))
            except ValueError:
                role_enums.append(UserRole.BUYER)
        
        status_enum = UserStatus.ACTIVE
        try:
            status_enum = UserStatus(self.status)
        except ValueError:
            pass

        loc = None
        if self.location and isinstance(self.location, dict):
            loc_data = dict(self.location)
            if loc_data.get("latitude") is None and self.latitude is not None:
                loc_data["latitude"] = self.latitude
            if loc_data.get("longitude") is None and self.longitude is not None:
                loc_data["longitude"] = self.longitude
            loc = Location(**loc_data)
        elif self.latitude is not None or self.longitude is not None:
            loc = Location(
                latitude=self.latitude,
                longitude=self.longitude,
                city=self.city,
                state=self.state,
                pincode=self.pincode,
            )

        return UserInDB(
            _id=str(self.id),
            phone=self.phone,
            name=self.name,
            business_name=self.business_name,
            roles=role_enums if role_enums else [UserRole.BUYER],
            status=status_enum,
            is_phone_verified=self.is_phone_verified,
            location=loc,
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
