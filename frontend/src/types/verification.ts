export type RiskTier = "low" | "medium" | "high";
export type VerificationStatus = "unverified" | "pending_review" | "verified" | "rejected";

export interface TrustSignalBreakdown {
  phone_otp_verified: boolean;
  phone_score_pts: number;
  location_verified: boolean;
  location_score_pts: number;
  live_camera_evidence_verified: boolean;
  live_camera_score_pts: number;
  profile_completion_verified: boolean;
  profile_completion_score_pts: number;
  duplicate_image_flag: boolean;
  total_trust_score: number;
  risk_tier: RiskTier;
  verification_status: VerificationStatus;
}

export interface VerificationResponse {
  id: string;
  seller_id: string;
  user_id: string;
  trust_score: number;
  risk_tier: RiskTier;
  verification_status: VerificationStatus;
  is_duplicate_flagged: boolean;
  signals: TrustSignalBreakdown;
  created_at: string;
}

export interface LiveEvidenceSubmissionPayload {
  workspace_photo: string;
  process_photo: string;
  finished_product_photo: string;
  additional_photos?: string[];
  latitude?: number;
  longitude?: number;
}
