import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db_session
from app.models.negotiation import NegotiationInDB, NegotiationModel, NegotiationSessionStatus

logger = logging.getLogger("artisan.repositories.negotiation")


class NegotiationRepository:
    """PostgreSQL Repository for Negotiation sessions and conversation turns."""

    @classmethod
    async def create_session(cls, data: dict, session: Optional[AsyncSession] = None) -> NegotiationInDB:
        if session:
            model = NegotiationModel(**data)
            session.add(model)
            await session.flush()
            await session.refresh(model)
            return model.to_pydantic()
        else:
            async with get_db_session() as s:
                async with s.begin():
                    model = NegotiationModel(**data)
                    s.add(model)
                    await s.flush()
                    await s.refresh(model)
                    return model.to_pydantic()

    @classmethod
    async def get_by_id(cls, session_id: str, session: Optional[AsyncSession] = None) -> Optional[NegotiationInDB]:
        if session:
            stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
            res = await session.execute(stmt)
            model = res.scalar_one_or_none()
            return model.to_pydantic() if model else None
        else:
            async with get_db_session() as s:
                stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
                res = await s.execute(stmt)
                model = res.scalar_one_or_none()
                return model.to_pydantic() if model else None

    @classmethod
    async def add_message(
        cls,
        session_id: str,
        message: Dict[str, Any],
        session: Optional[AsyncSession] = None
    ) -> Optional[NegotiationInDB]:
        if session:
            stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
            res = await session.execute(stmt)
            model = res.scalar_one_or_none()
            if not model:
                return None
            msgs = list(model.messages or [])
            msgs.append(message)
            model.messages = msgs
            await session.flush()
            await session.refresh(model)
            return model.to_pydantic()
        else:
            async with get_db_session() as s:
                async with s.begin():
                    stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
                    res = await s.execute(stmt)
                    model = res.scalar_one_or_none()
                    if not model:
                        return None
                    msgs = list(model.messages or [])
                    msgs.append(message)
                    model.messages = msgs
                    await s.flush()
                    await s.refresh(model)
                    return model.to_pydantic()

    @classmethod
    async def update_status_and_price(
        cls,
        session_id: str,
        status: NegotiationSessionStatus,
        agreed_price: Optional[float] = None,
        session: Optional[AsyncSession] = None
    ) -> Optional[NegotiationInDB]:
        if session:
            stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
            res = await session.execute(stmt)
            model = res.scalar_one_or_none()
            if not model:
                return None
            model.status = status.value
            if agreed_price is not None:
                model.agreed_price_inr = agreed_price
            await session.flush()
            await session.refresh(model)
            return model.to_pydantic()
        else:
            async with get_db_session() as s:
                async with s.begin():
                    stmt = select(NegotiationModel).where(NegotiationModel.id == session_id)
                    res = await s.execute(stmt)
                    model = res.scalar_one_or_none()
                    if not model:
                        return None
                    model.status = status.value
                    if agreed_price is not None:
                        model.agreed_price_inr = agreed_price
                    await s.flush()
                    await s.refresh(model)
                    return model.to_pydantic()
