import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class NegotiationSessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class NegotiationInDB(BaseModel):
    id: str = Field(alias="_id")
    buyer_id: str
    seller_id: str
    product_id: str
    order_id: Optional[str] = None
    status: NegotiationSessionStatus = NegotiationSessionStatus.ACTIVE
    floor_price_inr: float
    listed_price_inr: float
    current_offer_price_inr: Optional[float] = None
    agreed_price_inr: Optional[float] = None
    quantity: int = 1
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    metadata_context: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)


class NegotiationModel(Base):
    __tablename__ = "negotiations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"neg_{uuid.uuid4().hex[:12]}")
    buyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    seller_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    order_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default=NegotiationSessionStatus.ACTIVE.value, index=True, nullable=False)
    floor_price_inr: Mapped[float] = mapped_column(Float, nullable=False)
    listed_price_inr: Mapped[float] = mapped_column(Float, nullable=False)
    current_offer_price_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    agreed_price_inr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    messages: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    metadata_context: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> NegotiationInDB:
        status_enum = NegotiationSessionStatus.ACTIVE
        try:
            status_enum = NegotiationSessionStatus(self.status)
        except ValueError:
            pass

        return NegotiationInDB(
            _id=str(self.id),
            buyer_id=str(self.buyer_id),
            seller_id=str(self.seller_id),
            product_id=str(self.product_id),
            order_id=self.order_id,
            status=status_enum,
            floor_price_inr=float(self.floor_price_inr),
            listed_price_inr=float(self.listed_price_inr),
            current_offer_price_inr=float(self.current_offer_price_inr) if self.current_offer_price_inr is not None else None,
            agreed_price_inr=float(self.agreed_price_inr) if self.agreed_price_inr is not None else None,
            quantity=int(self.quantity),
            messages=self.messages or [],
            metadata_context=self.metadata_context or {},
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
