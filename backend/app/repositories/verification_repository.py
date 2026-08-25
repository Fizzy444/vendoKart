import logging
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from app.core.database import db_state
from app.models.verification import VerificationEvidenceInDB, VerificationEvidenceModel

logger = logging.getLogger("artisan.repository.verification")


class VerificationRepository:
    @classmethod
    async def create(cls, evidence: VerificationEvidenceInDB) -> VerificationEvidenceInDB:
        if not db_state.session_factory:
            return evidence

        model = VerificationEvidenceModel(
            id=str(evidence.id),
            seller_id=str(evidence.seller_id),
            user_id=str(evidence.user_id),
            phone=evidence.phone,
            workspace_photo=evidence.workspace_photo,
            process_photo=evidence.process_photo,
            finished_product_photo=evidence.finished_product_photo,
            additional_photos=evidence.additional_photos or [],
            location_lat=evidence.location_lat,
            location_lon=evidence.location_lon,
            ip_address=evidence.ip_address,
            user_agent=evidence.user_agent,
            trust_score=int(evidence.trust_score),
            risk_tier=evidence.risk_tier.value if hasattr(evidence.risk_tier, "value") else str(evidence.risk_tier),
            verification_status=evidence.verification_status.value if hasattr(evidence.verification_status, "value") else str(evidence.verification_status),
            image_hashes=evidence.image_hashes or [],
            is_duplicate_flagged=bool(evidence.is_duplicate_flagged),
            created_at=evidence.created_at or datetime.now(timezone.utc),
            updated_at=evidence.updated_at or datetime.now(timezone.utc),
        )

        try:
            async with db_state.session_factory() as session:
                session.add(model)
                await session.commit()
                await session.refresh(model)
                return model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in verification create: {e}")
            return evidence

    @classmethod
    async def get_by_seller_id(cls, seller_id: str) -> Optional[VerificationEvidenceInDB]:
        if not db_state.session_factory:
            return None
        try:
            async with db_state.session_factory() as session:
                stmt = select(VerificationEvidenceModel).where(
                    (VerificationEvidenceModel.seller_id == str(seller_id)) | (VerificationEvidenceModel.user_id == str(seller_id))
                ).order_by(VerificationEvidenceModel.created_at.desc())
                result = await session.execute(stmt)
                model = result.scalar_one_or_none()
                if model:
                    return model.to_pydantic()
        except Exception as e:
            logger.warning(f"Database error in verification get_by_seller_id: {e}")
        return None

    @classmethod
    async def get_all_image_hashes(cls) -> List[VerificationEvidenceModel]:
        if not db_state.session_factory:
            return []
        try:
            async with db_state.session_factory() as session:
                stmt = select(VerificationEvidenceModel)
                result = await session.execute(stmt)
                return list(result.scalars().all())
        except Exception as e:
            logger.warning(f"Database error in verification get_all_image_hashes: {e}")
            return []
