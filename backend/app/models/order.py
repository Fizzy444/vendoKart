import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class OrderStatus(str, Enum):
    REQUESTED = "REQUESTED"
    ACCEPTED = "ACCEPTED"
    NEGOTIATING = "NEGOTIATING"
    CONFIRMED = "CONFIRMED"
    IN_PRODUCTION = "IN_PRODUCTION"
    READY = "READY"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OrderInDB(BaseModel):
    id: str = Field(alias="_id")
    order_number: str
    buyer_id: str
    seller_id: str
    product_id: str
    quantity: int = 1
    unit_price_inr: float
    total_amount_inr: float
    status: OrderStatus = OrderStatus.REQUESTED
    customization_details: Optional[Dict[str, Any]] = None
    shipping_address: Optional[Dict[str, Any]] = None
    deadline_date: Optional[datetime] = None
    tracking_notes: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(populate_by_name=True)


class OrderModel(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: f"ord_{uuid.uuid4().hex[:12]}")
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    buyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    seller_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price_inr: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount_inr: Mapped[float] = mapped_column(Float, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default=OrderStatus.REQUESTED.value, index=True, nullable=False)
    customization_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    shipping_address: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    deadline_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tracking_notes: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_pydantic(self) -> OrderInDB:
        status_enum = OrderStatus.REQUESTED
        try:
            status_enum = OrderStatus(self.status)
        except ValueError:
            pass

        return OrderInDB(
            _id=str(self.id),
            order_number=self.order_number,
            buyer_id=str(self.buyer_id),
            seller_id=str(self.seller_id),
            product_id=str(self.product_id),
            quantity=int(self.quantity),
            unit_price_inr=float(self.unit_price_inr),
            total_amount_inr=float(self.total_amount_inr),
            status=status_enum,
            customization_details=self.customization_details,
            shipping_address=self.shipping_address,
            deadline_date=self.deadline_date,
            tracking_notes=self.tracking_notes or [],
            created_at=self.created_at or datetime.now(timezone.utc),
            updated_at=self.updated_at or datetime.now(timezone.utc),
        )
