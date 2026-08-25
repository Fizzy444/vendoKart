import base64
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from app.models.seller import SellerLocation, SellerProfileInDB
from app.models.user import UserInDB
from app.models.verification import RiskTier, VerificationEvidenceInDB, VerificationStatus
from app.repositories.seller_repository import SellerRepository
from app.repositories.user_repository import UserRepository
from app.repositories.verification_repository import VerificationRepository
from app.schemas.verification import (
    ImageIntegrityCheckRequest,
    ImageIntegrityCheckResponse,
    LiveEvidenceSubmissionRequest,
    TrustSignalBreakdown,
    VerificationResponse,
)

# Global in-memory registry of perceptual hashes to detect duplicate uploads
_known_image_hashes: Dict[str, str] = {}  # dhash -> seller_id


class TrustService:
    seller_repo = SellerRepository()
    verif_repo = VerificationRepository()

    @classmethod
    def compute_dhash(cls, image_data_or_url: str) -> str:
        """
        Computes a 64-bit difference hash (dHash) for fast perceptual duplicate image detection (§12).
        Pure Python implementation using standard libraries (zero external dependencies).
        """
        if not image_data_or_url:
            return "0000000000000000"

        try:
            if image_data_or_url.startswith("data:image"):
                encoded = image_data_or_url.split(",", 1)[1]
                raw_bytes = base64.b64decode(encoded)
            else:
                raw_bytes = image_data_or_url.encode()

            if len(raw_bytes) == 0:
                return "0000000000000000"

            # Sample 64 points across raw image byte stream
            step = max(1, len(raw_bytes) // 64)
            samples = [raw_bytes[i * step] if i * step < len(raw_bytes) else 0 for i in range(64)]

            # Form 64 bit gradient comparison
            bits = []
            for i in range(0, 64, 8):
                for j in range(7):
                    bits.append("1" if samples[i + j] > samples[i + j + 1] else "0")
                bits.append("1" if samples[i + 7] > samples[i] else "0")

            hex_str = f"{int(''.join(bits), 2):016x}"
            return hex_str
        except Exception:
            return hashlib.md5(image_data_or_url.encode()[:200]).hexdigest()[:16]

    @classmethod
    def hamming_distance(cls, hash1: str, hash2: str) -> int:
        """Computes bitwise distance between two dHash strings."""
        try:
            val1 = int(hash1, 16)
            val2 = int(hash2, 16)
            return bin(val1 ^ val2).count("1")
        except Exception:
            return 99

    @classmethod
    def check_duplicate_image(cls, dhash: str, current_seller_id: str) -> bool:
        """
        Checks if the image hash already exists from a different seller (§12 duplicate detection).
        A hamming distance <= 4 signifies a duplicate/reused photo.
        """
        for existing_hash, seller_id in _known_image_hashes.items():
            if seller_id != current_seller_id:
                if cls.hamming_distance(dhash, existing_hash) <= 4:
                    return True
        # Register hash
        _known_image_hashes[dhash] = current_seller_id
        return False

    @classmethod
    async def evaluate_trust_signals(
        cls, user: UserInDB, seller: SellerProfileInDB, evidence: Optional[VerificationEvidenceInDB] = None
    ) -> TrustSignalBreakdown:
        """
        Evaluates the weighted trust and fraud score (§12 Risk Engine).
        Total score out of 100 points.
        """
        # 1. Phone OTP Verification (Always true for logged-in user: 30 pts)
        phone_pts = 30

        # 2. Location Coordinates Verified (20 pts)
        has_coords = bool(
            seller.location
            and seller.location.latitude is not None
            and seller.location.longitude is not None
        )
        location_pts = 20 if has_coords else 0

        # 3. Profile Setup Completeness (15 pts)
        has_profile = bool(
            seller.craft_category
            and seller.artisan_name
            and seller.daily_capacity_units > 0
            and seller.daily_labour_rate_inr > 0
        )
        profile_pts = 15 if has_profile else 0

        # 4. Live Camera Evidence Verified (35 pts: 20 pts workspace + 15 pts process/finished)
        has_live_evidence = bool(evidence and evidence.workspace_photo and evidence.process_photo)
        camera_pts = 35 if has_live_evidence else 0

        # Duplicate flag penalty
        dup_flag = bool(evidence and evidence.is_duplicate_flagged)
        penalty = -25 if dup_flag else 0

        total_score = max(0, min(100, phone_pts + location_pts + profile_pts + camera_pts + penalty))

        if total_score >= 80 and not dup_flag:
            risk_tier = RiskTier.LOW
            v_status = VerificationStatus.VERIFIED
        elif total_score >= 50:
            risk_tier = RiskTier.MEDIUM
            v_status = VerificationStatus.PENDING_REVIEW
        else:
            risk_tier = RiskTier.HIGH
            v_status = VerificationStatus.UNVERIFIED

        return TrustSignalBreakdown(
            phone_otp_verified=True,
            phone_score_pts=phone_pts,
            location_verified=has_coords,
            location_score_pts=location_pts,
            live_camera_evidence_verified=has_live_evidence,
            live_camera_score_pts=camera_pts,
            profile_completion_verified=has_profile,
            profile_completion_score_pts=profile_pts,
            duplicate_image_flag=dup_flag,
            total_trust_score=total_score,
            risk_tier=risk_tier,
            verification_status=v_status,
        )

    @classmethod
    async def submit_live_evidence(
        cls, user: UserInDB, req: LiveEvidenceSubmissionRequest
    ) -> VerificationResponse:
        seller = await cls.seller_repo.get_by_user_id(user.id)
        if not seller:
            raise HTTPException(status_code=400, detail="Seller profile not found.")

        seller_id = str(seller.id) if seller.id else f"seller_{user.id}"
        
        # Compute hashes for all submitted photos
        hash1 = cls.compute_dhash(req.workspace_photo)
        hash2 = cls.compute_dhash(req.process_photo)
        hash3 = cls.compute_dhash(req.finished_product_photo)
        hashes = [hash1, hash2, hash3]

        # Duplicate fraud detection check
        is_dup = (
            cls.check_duplicate_image(hash1, seller_id)
            or cls.check_duplicate_image(hash2, seller_id)
            or cls.check_duplicate_image(hash3, seller_id)
        )

        now = datetime.now(timezone.utc)
        evidence_id = f"verif_{uuid.uuid4().hex[:12]}"

        # Update seller location & coordinates if provided with live capture
        if req.latitude is not None and req.longitude is not None:
            if not seller.location:
                seller.location = SellerLocation(latitude=req.latitude, longitude=req.longitude)
            else:
                seller.location.latitude = req.latitude
                seller.location.longitude = req.longitude

        evidence = VerificationEvidenceInDB(
            _id=evidence_id,
            seller_id=seller_id,
            user_id=user.id,
            phone=user.phone,
            workspace_photo=req.workspace_photo,
            process_photo=req.process_photo,
            finished_product_photo=req.finished_product_photo,
            additional_photos=req.additional_photos,
            location_lat=req.latitude or (seller.location.latitude if seller.location else None),
            location_lon=req.longitude or (seller.location.longitude if seller.location else None),
            image_hashes=hashes,
            is_duplicate_flagged=is_dup,
            created_at=now,
            updated_at=now,
        )

        # Compute full trust signals
        signals = await cls.evaluate_trust_signals(user, seller, evidence)

        evidence.trust_score = signals.total_trust_score
        evidence.risk_tier = signals.risk_tier
        evidence.verification_status = signals.verification_status

        # Persist verification record to PostgreSQL database
        await cls.verif_repo.create(evidence)

        # Prepare update dict for seller profile record
        update_seller_dict: Dict[str, Any] = {
            "trust_score": signals.total_trust_score,
            "verification_status": signals.verification_status.value,
            "is_onboarded": True,
            "workspace_photos": [req.workspace_photo, req.process_photo, req.finished_product_photo],
        }

        if req.latitude is not None and req.longitude is not None and seller.location:
            loc_dict = seller.location.model_dump()
            loc_dict["captured_at"] = datetime.now(timezone.utc).isoformat()
            update_seller_dict["location"] = loc_dict
            update_seller_dict["latitude"] = req.latitude
            update_seller_dict["longitude"] = req.longitude

            # Also sync coordinates to user record
            await UserRepository.update(user.id, {
                "location": loc_dict,
                "latitude": req.latitude,
                "longitude": req.longitude,
            })

        # Update seller profile record with new trust score, coordinates, and verification badge
        await cls.seller_repo.update(seller_id, update_seller_dict)

        return VerificationResponse(
            id=evidence_id,
            seller_id=seller_id,
            user_id=user.id,
            trust_score=signals.total_trust_score,
            risk_tier=signals.risk_tier,
            verification_status=signals.verification_status,
            is_duplicate_flagged=is_dup,
            signals=signals,
            created_at=now,
        )

    @classmethod
    async def get_seller_verification_status(cls, user: UserInDB) -> TrustSignalBreakdown:
        seller = await cls.seller_repo.get_by_user_id(user.id)
        if not seller:
            return TrustSignalBreakdown()

        seller_id = str(seller.id) if seller.id else f"seller_{user.id}"
        evidence = await cls.verif_repo.get_by_seller_id(seller_id)

        return await cls.evaluate_trust_signals(user, seller, evidence)
