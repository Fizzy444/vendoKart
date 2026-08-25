import logging
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.models.order import OrderInDB, OrderModel, OrderStatus

logger = logging.getLogger("artisan.repositories.order")


class OrderRepository:
    """PostgreSQL Repository for Order lifecycle and tracking."""

    @classmethod
    async def create_order(cls, order_data: dict, session: Optional[AsyncSession] = None) -> OrderInDB:
        if session:
            model = OrderModel(**order_data)
            session.add(model)
            await session.flush()
            await session.refresh(model)
            return model.to_pydantic()
        else:
            async with get_db_session() as s:
                async with s.begin():
                    model = OrderModel(**order_data)
                    s.add(model)
                    await s.flush()
                    await s.refresh(model)
                    return model.to_pydantic()

    @classmethod
    async def get_by_id(cls, order_id: str, session: Optional[AsyncSession] = None) -> Optional[OrderInDB]:
        if session:
            stmt = select(OrderModel).where(OrderModel.id == order_id)
            res = await session.execute(stmt)
            model = res.scalar_one_or_none()
            return model.to_pydantic() if model else None
        else:
            async with get_db_session() as s:
                stmt = select(OrderModel).where(OrderModel.id == order_id)
                res = await s.execute(stmt)
                model = res.scalar_one_or_none()
                return model.to_pydantic() if model else None

    @classmethod
    async def update_status(
        cls,
        order_id: str,
        new_status: OrderStatus,
        tracking_note: Optional[str] = None,
        session: Optional[AsyncSession] = None
    ) -> Optional[OrderInDB]:
        if session:
            stmt = select(OrderModel).where(OrderModel.id == order_id)
            res = await session.execute(stmt)
            model = res.scalar_one_or_none()
            if not model:
                return None
            model.status = new_status.value
            if tracking_note:
                notes = list(model.tracking_notes or [])
                notes.append({"status": new_status.value, "note": tracking_note})
                model.tracking_notes = notes
            await session.flush()
            await session.refresh(model)
            return model.to_pydantic()
        else:
            async with get_db_session() as s:
                async with s.begin():
                    stmt = select(OrderModel).where(OrderModel.id == order_id)
                    res = await s.execute(stmt)
                    model = res.scalar_one_or_none()
                    if not model:
                        return None
                    model.status = new_status.value
                    if tracking_note:
                        notes = list(model.tracking_notes or [])
                        notes.append({"status": new_status.value, "note": tracking_note})
                        model.tracking_notes = notes
                    await s.flush()
                    await s.refresh(model)
                    return model.to_pydantic()
