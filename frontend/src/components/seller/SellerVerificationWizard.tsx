"use client";

import React, { useState, useEffect } from "react";
import { SellerProfile } from "@/types/seller";
import { TrustSignalBreakdown, VerificationResponse } from "@/types/verification";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Phone,
  FileText,
  Lock,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { LiveCameraAssistant, LiveCapturedEvidence } from "./LiveCameraAssistant";

interface SellerVerificationWizardProps {
  sellerProfile: SellerProfile | null;
  onVerificationComplete: (result: VerificationResponse) => void;
  onClose?: () => void;
}

export function SellerVerificationWizard({
  sellerProfile,
  onVerificationComplete,
  onClose,
}: SellerVerificationWizardProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trustStatus, setTrustStatus] = useState<TrustSignalBreakdown | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load current verification status
  const loadStatus = async () => {
    try {
      const status = await api.getVerificationStatus();
      setTrustStatus(status);
    } catch (err: any) {
      console.warn("Could not fetch verification status:", err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCameraComplete = async (evidence: LiveCapturedEvidence) => {
    setIsCameraActive(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Get current geolocation if available
      let lat: number | undefined = sellerProfile?.location?.latitude;
      let lon: number | undefined = sellerProfile?.location?.longitude;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (geoErr) {
          console.warn("Live geolocation capture skipped:", geoErr);
        }
      }

      const res = await api.submitLiveEvidence({
        workspace_photo: evidence.workspace_photo,
        process_photo: evidence.process_photo,
        finished_product_photo: evidence.finished_product_photo,
        latitude: lat,
        longitude: lon,
      });

      setSuccessMsg("Artisan presence verified successfully! Your studio is now fully authenticated.");
      setTrustStatus(res.signals);
      onVerificationComplete(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit live evidence. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCameraActive) {
    return (
      <LiveCameraAssistant
        onComplete={handleCameraComplete}
        onCancel={() => setIsCameraActive(false)}
      />
    );
  }

  const currentScore = trustStatus?.total_trust_score ?? sellerProfile?.trust_score ?? 65;
  const isFullyVerified = currentScore >= 80;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-800 flex items-center justify-between bg-slate-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                Artisan Presence & Trust Engine (§12)
              </h2>
              {isFullyVerified ? (
                <Badge variant="success" size="sm">
                  Verified Studio
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Verification Pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Verify physical venue, live craft making, and GPS coordinates to build buyer trust.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Trust Gauge & Score Meter */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950 to-emerald-950/30 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Trust Score
            </span>
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-3xl font-extrabold text-emerald-400">{currentScore}%</span>
              <span className="text-xs text-slate-400">
                {isFullyVerified ? "• Low Risk (Auto-Verified)" : "• Medium Risk (Complete Live Capture)"}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md pt-1">
              Verified artisan studios receive the gold trust badge on all product listings and 3.2x higher buyer order inquiries.
            </p>
          </div>

          <div className="shrink-0">
            {!isFullyVerified ? (
              <Button
                type="button"
                size="md"
                onClick={() => setIsCameraActive(true)}
                isLoading={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 text-xs shadow-xl shadow-emerald-500/20"
              >
                <Camera className="w-4 h-4 mr-2" />
                Launch Live Camera Studio
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>100% Authenticated Studio</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Trust Verification Pillars (§12 Signals Breakdown) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-artisan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Authentication Pillars & Signal Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Pillar 1: Phone OTP */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Phone Ownership (OTP)</h4>
                  <p className="text-[11px] text-slate-400">2Factor SMS verified</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                +30 pts ✓
              </Badge>
            </div>

            {/* Pillar 2: GPS Location */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Workshop Location</h4>
                  <p className="text-[11px] text-slate-400">
                    {sellerProfile?.location?.city
                      ? `${sellerProfile.location.city}, ${sellerProfile.location.state}`
                      : "Geocoded address coordinates"}
                  </p>
                </div>
              </div>
              <Badge
                variant={sellerProfile?.location?.latitude ? "success" : "neutral"}
                size="sm"
              >
                {sellerProfile?.location?.latitude ? "+20 pts ✓" : "0 pts"}
              </Badge>
            </div>

            {/* Pillar 3: Profile Setup */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Master Artisan Profile</h4>
                  <p className="text-[11px] text-slate-400">
                    {sellerProfile?.craft_category || "Craft classification & daily capacity"}
                  </p>
                </div>
              </div>
              <Badge
                variant={sellerProfile?.is_onboarded ? "success" : "neutral"}
                size="sm"
              >
                {sellerProfile?.is_onboarded ? "+15 pts ✓" : "0 pts"}
              </Badge>
            </div>

            {/* Pillar 4: Live Camera Capture */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Live 3-Photo Evidence</h4>
                  <p className="text-[11px] text-slate-400">Workspace + Process + Piece</p>
                </div>
              </div>
              <Badge
                variant={
                  trustStatus?.live_camera_evidence_verified || isFullyVerified
                    ? "success"
                    : "warning"
                }
                size="sm"
              >
                {trustStatus?.live_camera_evidence_verified || isFullyVerified
                  ? "+35 pts ✓"
                  : "Pending Capture"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Live Camera Re-Verification Option */}
        {isFullyVerified && (
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCameraActive(true)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retake Verification Photos
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
