"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { SellerProfile } from "@/types/seller";
import { SellerProfileWizard } from "@/components/seller/SellerProfileWizard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Hammer,
  ShoppingBag,
  Mic,
  Camera,
  Calculator,
  Package,
  Sparkles,
  Phone,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Palette,
  Store,
  MapPin,
  Users,
  Layers,
  IndianRupee,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, openAuthModal, devLogin, logout, refreshUser } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // Derive role
  const isSeller = user?.roles.includes("seller") || user?.roles.includes("admin");

  // Fetch Seller Profile if user has seller role
  const fetchSellerProfile = async () => {
    if (!user || !isSeller) {
      return;
    }
    setLoadingProfile(true);
    try {
      const profile = await api.getSellerProfile();
      setSellerProfile(profile);
    } catch (err) {
      console.warn("Could not fetch seller profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchSellerProfile();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-artisan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Logged-out state
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 min-h-[70vh]">
        <Card className="max-w-md w-full text-center p-8 space-y-5 bg-slate-900 border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-artisan-500/10 text-artisan-400 mx-auto flex items-center justify-center border border-artisan-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Welcome to vendoKart</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sign in with your mobile number to access your artisan workspace or customer dashboard.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => openAuthModal("seller")} className="w-full sm:w-auto">
              <Hammer className="w-4 h-4 mr-1.5 text-artisan-300" />
              Artisan Sign In
            </Button>
            <Button variant="secondary" onClick={() => openAuthModal("buyer")} className="w-full sm:w-auto">
              <ShoppingBag className="w-4 h-4 mr-1.5 text-ochre-400" />
              Buyer Sign In
            </Button>
          </div>

          {/* Dev Test Quick Sign In Buttons */}
          <div className="pt-4 mt-2 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-500 font-medium">⚡ Instant 1-Click Dev Testing:</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => devLogin("seller")}
                className="px-3.5 py-2 rounded-xl bg-artisan-500/10 hover:bg-artisan-500/20 border border-artisan-500/30 text-artisan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Dev Test Seller
              </button>
              <button
                type="button"
                onClick={() => devLogin("buyer")}
                className="px-3.5 py-2 rounded-xl bg-ochre-500/10 hover:bg-ochre-500/20 border border-ochre-500/30 text-ochre-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Dev Test Buyer
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const displayName =
    sellerProfile?.business_name ||
    sellerProfile?.artisan_name ||
    user.business_name ||
    user.name ||
    (isSeller ? "Master Artisan" : "Craft Collector");

  const computedLaborCostPerUnit =
    sellerProfile && sellerProfile.daily_capacity_units > 0
      ? (
          (sellerProfile.daily_labour_rate_inr * sellerProfile.number_of_workers) /
          sellerProfile.daily_capacity_units
        ).toFixed(0)
      : "40";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* 1. Header & Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-artisan-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-artisan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-artisan-500/20 text-artisan-300 border border-artisan-500/30">
              {isSeller ? "🎨 Seller Studio" : "🛍️ Buyer Marketplace"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Verified OTP Account
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Namaste, {displayName}!
          </h1>

          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500" /> {user.phone}
            {isSeller && sellerProfile?.craft_category && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-artisan-300 font-medium">{sellerProfile.craft_category}</span>
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center gap-2.5 self-start md:self-auto">
          {isSeller && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWizardOpen(!isWizardOpen)}
              className="text-xs border-artisan-500/40 text-artisan-300 hover:bg-artisan-500/10"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              {isWizardOpen ? "Close Editor" : "Edit Studio Profile"}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-red-400 hover:text-red-300">
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SELLER DASHBOARD VIEW ONLY                                    */}
      {/* ============================================================ */}
      {isSeller ? (
        <>
          {/* 2. Inline Studio Configuration Card (When Editing) */}
          {isWizardOpen && (
            <SellerProfileWizard
              initialProfile={sellerProfile}
              isOpen={isWizardOpen}
              onClose={() => setIsWizardOpen(false)}
              onSuccess={(updated) => {
                setSellerProfile(updated);
                refreshUser();
                setIsWizardOpen(false);
              }}
            />
          )}

          {/* 3. Onboarding Prompt Banner (If seller hasn't completed full studio setup and not actively editing) */}
          {sellerProfile && !sellerProfile.is_onboarded && !isWizardOpen && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-artisan-950/80 via-slate-900 to-ochre-950/40 border border-artisan-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-artisan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-artisan-500"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-artisan-300">
                    Action Required: Stage 1 Setup
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Complete your Artisan Studio & Workspace Profile
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Define your craft specialty, active workers, labor wage, and capture workshop address to unlock verified status and deterministic pricing.
                </p>
              </div>
              <Button
                onClick={() => setIsWizardOpen(true)}
                className="bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold px-5 shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Complete Profile Setup
              </Button>
            </div>
          )}

          {/* 4. Artisan Studio Overview Card (Stage 1 Core Deliverable) */}
          {sellerProfile && !isWizardOpen && (
            <Card className="p-6 sm:p-8 bg-slate-900 border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20 shrink-0">
                    <Hammer className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-100">
                        {sellerProfile.business_name || "Artisan Craft Studio"}
                      </h2>
                      <Badge variant="primary" size="sm">
                        {sellerProfile.craft_category}
                      </Badge>
                      {sellerProfile.is_onboarded && (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified Studio
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lead Artisan: <strong className="text-slate-200">{sellerProfile.artisan_name}</strong> •{" "}
                      {sellerProfile.experience_years} Years Craft Experience • {sellerProfile.seller_type.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWizardOpen(true)}
                  className="text-xs shrink-0 self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Update Studio Info
                </Button>
              </div>

              {/* Bio / Artisan Heritage */}
              {sellerProfile.bio && (
                <p className="text-xs text-slate-300 italic bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
                  &ldquo;{sellerProfile.bio}&rdquo;
                </p>
              )}

              {/* Craft Specialties Tags */}
              {sellerProfile.craft_specialties?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Craft Specialties & Products:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sellerProfile.craft_specialties.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-artisan-500/10 border border-artisan-500/20 text-artisan-300 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Workspace Capacity & Parameters Matrix (§11 Deterministic Foundations) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-artisan-400" /> Active Workers (W)
                  </span>
                  <p className="text-lg font-bold text-slate-100 mt-1">{sellerProfile.number_of_workers} Craftsmen</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Daily Labour Rate (L)
                  </span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">₹{sellerProfile.daily_labour_rate_inr} / day</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Daily Capacity (U)
                  </span>
                  <p className="text-lg font-bold text-slate-100 mt-1">{sellerProfile.daily_capacity_units} units / day</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Base Labor Cost
                  </span>
                  <p className="text-lg font-bold text-amber-400 mt-1">₹{computedLaborCostPerUnit} / unit</p>
                </div>
              </div>

              {/* Location & Trust Level (§12 Presence Verification) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-artisan-400 shrink-0" />
                  <span>
                    {sellerProfile.location?.city || sellerProfile.location?.state ? (
                      <>
                        <strong className="text-slate-100">
                          {sellerProfile.location.city || "Cluster City"}
                          {sellerProfile.location.state ? `, ${sellerProfile.location.state}` : ""}
                        </strong>
                        {sellerProfile.location.pincode ? ` (${sellerProfile.location.pincode})` : ""}
                        {sellerProfile.location.address ? ` • ${sellerProfile.location.address}` : ""}
                      </>
                    ) : (
                      <span className="text-slate-500">Location not yet configured</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Trust Score:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {sellerProfile.trust_score}%
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* 5. Seller Stage Modules */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-artisan-400" />
              Artisan Business Manager Modules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Cataloging */}
              <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-artisan-500/60">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20">
                    <Mic className="w-6 h-6" />
                  </div>
                  <Badge variant="primary" size="sm">Voice AI</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-artisan-300 transition-colors">
                  1. Voice-to-Catalog Listing
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Describe your craft in Hindi, Tamil, Bengali, or English. AI automatically transcribes specifications, story, and attributes.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-artisan-400 group-hover:translate-x-1 transition-transform">
                  Start Voice Recording <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Card>

              {/* Smart Photography Studio */}
              <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-artisan-500/60">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-ochre-500/10 text-ochre-400 flex items-center justify-center border border-ochre-500/20">
                    <Camera className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" size="sm">Photo AI</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-ochre-300 transition-colors">
                  2. AI Photography Assistant
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Guided camera mode checks lighting, blur, and 5-angle craft angles to generate high-converting studio-grade photos.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-ochre-400 group-hover:translate-x-1 transition-transform">
                  Launch Photo Studio <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Card>

              {/* Deterministic Fair Pricing */}
              <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-artisan-500/60">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <Badge variant="success" size="sm">Fair Margin</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  3. Deterministic Fair Pricing Calculator
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Input raw materials + hourly labor. Hard math guarantees a profitable non-negotiable floor price for your hard work.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                  Calculate Margins <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Card>

              {/* Orders & Bulk Aggregation */}
              <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-artisan-500/60">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Package className="w-6 h-6" />
                  </div>
                  <Badge variant="neutral" size="sm">Fulfillment</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  4. Order Management & Dispatch
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive instant order notifications, generate shipping labels, and participate in pooled corporate bulk orders.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                  View Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* ============================================================ */
        /* BUYER DASHBOARD VIEW ONLY                                    */
        /* ============================================================ */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-artisan-400" />
            Discover & Shop Handcrafted Heritage
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Browse Regional Clusters */}
            <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-ochre-500/60">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-ochre-500/10 text-ochre-400 flex items-center justify-center border border-ochre-500/20">
                  <Store className="w-6 h-6" />
                </div>
                <Badge variant="secondary" size="sm">Handmade</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-ochre-300 transition-colors">
                1. Browse Regional Clusters
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct access to master weavers and pottery clusters across Varanasi, Kanchipuram, Jaipur, and Kashmir.
              </p>
              <div className="pt-2 flex items-center text-xs font-semibold text-ochre-400 group-hover:translate-x-1 transition-transform">
                Explore Marketplace <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>

            {/* Custom Bespoke Orders */}
            <Card variant="interactive" className="p-6 space-y-3 cursor-pointer group hover:border-ochre-500/60">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20">
                  <Palette className="w-6 h-6" />
                </div>
                <Badge variant="primary" size="sm">Bespoke</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-artisan-300 transition-colors">
                2. Request Custom Craft Design
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect directly with artisans to request custom sizing, specific colors, and personalized engravings.
              </p>
              <div className="pt-2 flex items-center text-xs font-semibold text-artisan-400 group-hover:translate-x-1 transition-transform">
                Request Custom Piece <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Footer Status */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Authenticated with 2Factor.in Voice OTP Security
        </span>
        <span className="text-slate-500">
          vendoKart • AI Virtual Business Manager for Traditional Artisans
        </span>
      </div>
    </div>
  );
}
