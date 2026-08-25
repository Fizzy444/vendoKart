"use client";

import React, { useState, useEffect } from "react";
import {
  CraftCategory,
  SellerLocation,
  SellerProfile,
  SellerProfileUpdatePayload,
  SellerType,
  WorkspaceType,
} from "@/types/seller";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import {
  Hammer,
  Sparkles,
  MapPin,
  Users,
  Clock,
  IndianRupee,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Navigation,
  Layers,
  Check,
} from "lucide-react";

interface SellerProfileWizardProps {
  initialProfile?: SellerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: SellerProfile) => void;
}

const CRAFT_CATEGORIES: CraftCategory[] = [
  "Bamboo Craft",
  "Handloom & Textiles",
  "Pottery & Ceramics",
  "Woodworking & Carving",
  "Metal Craft & Bell Metal",
  "Handmade Jewellery",
  "Terracotta",
  "Embroidery & Needlework",
  "Leather Craft",
  "Traditional Painting & Folk Art",
  "Stone Carving",
  "Other Craft",
];

const SELLER_TYPES: { label: string; value: SellerType; desc: string }[] = [
  {
    label: "Individual Artisan",
    value: "individual_artisan",
    desc: "Single craft practitioner or master maker working independently.",
  },
  {
    label: "Family Business",
    value: "family_business",
    desc: "Multi-generational household passing craft techniques across generations.",
  },
  {
    label: "Artisan Cooperative",
    value: "cooperative",
    desc: "Registered cooperative cluster pooling raw materials and production capacity.",
  },
  {
    label: "Self-Help Group (SHG)",
    value: "self_help_group",
    desc: "Community self-help group sharing equipment and joint order fulfillment.",
  },
  {
    label: "Rural Producer Group",
    value: "rural_producer_group",
    desc: "Aggregated cluster of village artisans under unified local supervision.",
  },
  {
    label: "Small Retail Artisan",
    value: "small_retail",
    desc: "Studio maker retailing directly from workshop storefront.",
  },
];

const WORKSPACE_TYPES: { label: string; value: WorkspaceType; desc: string }[] = [
  {
    label: "Home Workshop",
    value: "home_workshop",
    desc: "Craft space integrated directly in home or village residence.",
  },
  {
    label: "Dedicated Studio",
    value: "dedicated_studio",
    desc: "Separate standalone workshop premises with dedicated craft stations.",
  },
  {
    label: "Community Shed",
    value: "community_shed",
    desc: "Shared community infrastructure (e.g. collective pit looms, common kilns).",
  },
  {
    label: "Cooperative Center",
    value: "cooperative_center",
    desc: "Cluster facility with shared raw material storage and dispatch desks.",
  },
];

export function SellerProfileWizard({
  initialProfile,
  isOpen,
  onClose,
  onSuccess,
}: SellerProfileWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State - Step 1: Craft & Story
  const [artisanName, setArtisanName] = useState(
    initialProfile?.artisan_name || ""
  );
  const [businessName, setBusinessName] = useState(
    initialProfile?.business_name || ""
  );
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [craftCategory, setCraftCategory] = useState<CraftCategory>(
    initialProfile?.craft_category || "Bamboo Craft"
  );
  const [specialtiesText, setSpecialtiesText] = useState(
    initialProfile?.craft_specialties?.join(", ") || ""
  );
  const [experienceYears, setExperienceYears] = useState(
    initialProfile?.experience_years ?? 5
  );
  const [sellerType, setSellerType] = useState<SellerType>(
    initialProfile?.seller_type || "individual_artisan"
  );

  // Form State - Step 2: Capacity & Workspace
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(
    initialProfile?.workspace_type || "home_workshop"
  );
  const [numberOfWorkers, setNumberOfWorkers] = useState(
    initialProfile?.number_of_workers ?? 1
  );
  const [dailyLabourRate, setDailyLabourRate] = useState(
    initialProfile?.daily_labour_rate_inr ?? 450
  );
  const [dailyCapacityUnits, setDailyCapacityUnits] = useState(
    initialProfile?.daily_capacity_units ?? 10
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    initialProfile?.lead_time_days ?? 3
  );

  // Form State - Step 3: Location
  const [latitude, setLatitude] = useState<number | undefined>(
    initialProfile?.location?.latitude
  );
  const [longitude, setLongitude] = useState<number | undefined>(
    initialProfile?.location?.longitude
  );
  const [address, setAddress] = useState(initialProfile?.location?.address || "");
  const [city, setCity] = useState(initialProfile?.location?.city || "");
  const [district, setDistrict] = useState(initialProfile?.location?.district || "");
  const [stateName, setStateName] = useState(initialProfile?.location?.state || "");
  const [pincode, setPincode] = useState(initialProfile?.location?.pincode || "");

  // Sync state if initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      setArtisanName(initialProfile.artisan_name || "");
      setBusinessName(initialProfile.business_name || "");
      setBio(initialProfile.bio || "");
      setCraftCategory(initialProfile.craft_category || "Bamboo Craft");
      setSpecialtiesText(initialProfile.craft_specialties?.join(", ") || "");
      setExperienceYears(initialProfile.experience_years ?? 5);
      setSellerType(initialProfile.seller_type || "individual_artisan");
      setWorkspaceType(initialProfile.workspace_type || "home_workshop");
      setNumberOfWorkers(initialProfile.number_of_workers ?? 1);
      setDailyLabourRate(initialProfile.daily_labour_rate_inr ?? 450);
      setDailyCapacityUnits(initialProfile.daily_capacity_units ?? 10);
      setLeadTimeDays(initialProfile.lead_time_days ?? 3);
      if (initialProfile.location) {
        setLatitude(initialProfile.location.latitude);
        setLongitude(initialProfile.location.longitude);
        setAddress(initialProfile.location.address || "");
        setCity(initialProfile.location.city || "");
        setDistrict(initialProfile.location.district || "");
        setStateName(initialProfile.location.state || "");
        setPincode(initialProfile.location.pincode || "");
      }
    }
  }, [initialProfile]);

  if (!isOpen) return null;

  // Browser Geolocation capture & clean reverse geocoding
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const displayName = data.display_name || "";

            const detectedState = addr.state || "";
            const detectedPincode = addr.postcode
              ? addr.postcode.replace(/\D/g, "").slice(0, 6)
              : "";

            const detectedCity =
              addr.city ||
              addr.town ||
              addr.municipality ||
              addr.village ||
              addr.city_district ||
              addr.suburb ||
              "";

            const detectedDistrict =
              addr.state_district ||
              addr.district ||
              addr.county ||
              detectedCity ||
              "";

            // Build rich, clean street address
            const localKeys = [
              "house_number",
              "building",
              "house_name",
              "road",
              "street",
              "neighbourhood",
              "residential",
              "suburb",
              "city_district",
              "county",
              "village",
              "hamlet",
            ];

            const parts: string[] = [];
            const seen = new Set<string>();

            for (const key of localKeys) {
              const val = addr[key];
              if (
                val &&
                !seen.has(val.toLowerCase()) &&
                val.toLowerCase() !== detectedCity.toLowerCase() &&
                val.toLowerCase() !== detectedState.toLowerCase()
              ) {
                seen.add(val.toLowerCase());
                parts.push(val);
              }
            }

            let detectedStreet = parts.join(", ");

            if (!detectedStreet || detectedStreet.length < 4) {
              const rawParts = displayName.split(",").map((p: string) => p.trim());
              const filtered = rawParts.filter(
                (p: string) =>
                  p.toLowerCase() !== detectedState.toLowerCase() &&
                  p.toLowerCase() !== "india" &&
                  p !== detectedPincode
              );
              detectedStreet =
                filtered.slice(0, 3).join(", ") || displayName.split(",")[0] || "";
            }

            if (detectedStreet) setAddress(detectedStreet);
            if (detectedCity) setCity(detectedCity);
            if (detectedDistrict) setDistrict(detectedDistrict);
            if (detectedState) setStateName(detectedState);
            if (detectedPincode) setPincode(detectedPincode);
          }
        } catch (err) {
          console.warn("Reverse geocode error:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert("Could not obtain location coordinates: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);

    const specialties = specialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const locationObj: SellerLocation = {
      latitude,
      longitude,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      district: district.trim() || undefined,
      state: stateName.trim() || undefined,
      pincode: pincode.trim() || undefined,
    };

    const payload: SellerProfileUpdatePayload = {
      artisan_name: artisanName.trim() || "Master Artisan",
      business_name: businessName.trim() || undefined,
      bio: bio.trim() || undefined,
      craft_category: craftCategory,
      craft_specialties: specialties,
      experience_years: experienceYears,
      seller_type: sellerType,
      workspace_type: workspaceType,
      number_of_workers: Math.max(1, numberOfWorkers),
      daily_labour_rate_inr: Math.max(0, dailyLabourRate),
      daily_capacity_units: Math.max(1, dailyCapacityUnits),
      lead_time_days: Math.max(0, leadTimeDays),
      location: locationObj,
    };

    try {
      const updated = await api.updateSellerProfile(payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const computedUnitLaborCost =
    dailyCapacityUnits > 0
      ? ((dailyLabourRate * numberOfWorkers) / dailyCapacityUnits).toFixed(0)
      : "0";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Header */}
        <div className="p-6 sm:p-7 border-b border-slate-800 flex items-center justify-between bg-slate-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20 shrink-0">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Artisan Studio & Workspace Setup
            </h2>
            <p className="text-xs text-slate-400">
              Stage 1 — Verify your craft specialty, production capacity, and workshop location.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          title="Close Editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 text-xs">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`py-3.5 px-4 flex items-center justify-center gap-2 font-medium border-b-2 transition-all ${
            step === 1
              ? "border-artisan-500 text-artisan-300 bg-artisan-500/5 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800">
            1
          </span>
          Craft & Story
        </button>

        <button
          type="button"
          onClick={() => setStep(2)}
          className={`py-3.5 px-4 flex items-center justify-center gap-2 font-medium border-b-2 transition-all ${
            step === 2
              ? "border-artisan-500 text-artisan-300 bg-artisan-500/5 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800">
            2
          </span>
          Capacity & Pricing
        </button>

        <button
          type="button"
          onClick={() => setStep(3)}
          className={`py-3.5 px-4 flex items-center justify-center gap-2 font-medium border-b-2 transition-all ${
            step === 3
              ? "border-artisan-500 text-artisan-300 bg-artisan-500/5 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800">
            3
          </span>
          Workshop Location
        </button>
      </div>

      {/* Form Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 1: CRAFT & STORY */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lead Artisan Full Name *
                </label>
                <input
                  type="text"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workshop / Brand Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Chandra Heritage Weaves"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Craft Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CRAFT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCraftCategory(cat)}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                      craftCategory === cat
                        ? "bg-artisan-500/20 border-artisan-500 text-artisan-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specialties & Products (comma separated)
              </label>
              <input
                type="text"
                value={specialtiesText}
                onChange={(e) => setSpecialtiesText(e.target.value)}
                placeholder="e.g. Bamboo lamps, cane baskets, fruit bowls, hand-carved trays"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Years of Craft Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Artisan Operational Structure
                </label>
                <select
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value as SellerType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                >
                  {SELLER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Heritage Story & Craft Journey
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share the generational heritage of your technique, traditional materials sourced, and family traditions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CAPACITY & WORKSPACE */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workspace Facility Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WORKSPACE_TYPES.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setWorkspaceType(w.value)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      workspaceType === w.value
                        ? "bg-artisan-500/20 border-artisan-500 text-artisan-300 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{w.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-artisan-400" />
                  Number of Active Workers (W)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={numberOfWorkers}
                  onChange={(e) => setNumberOfWorkers(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Artisans actively crafting at this studio
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  Daily Labour Rate / Worker (L)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={dailyLabourRate}
                  onChange={(e) => setDailyLabourRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Fair daily wage rate (₹/day)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Daily Production Capacity (U)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={dailyCapacityUnits}
                  onChange={(e) => setDailyCapacityUnits(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Average finished units crafted per day
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Order Lead Time (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Production prep time for custom orders
                </p>
              </div>
            </div>

            {/* Formula & Deterministic Preview Card (§11) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-artisan-950/60 to-slate-950 border border-artisan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-artisan-300">
                <Sparkles className="w-4 h-4 text-artisan-400" />
                <span>Deterministic Pricing Engine (§11 Formula Preview)</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Unit Labour Cost = (W × L) / U = ({numberOfWorkers} × ₹{dailyLabourRate}) / {dailyCapacityUnits} ={" "}
                <strong className="text-emerald-400 font-bold">₹{computedUnitLaborCost} / unit</strong>
              </p>
              <p className="text-[10px] text-slate-500">
                This deterministic cost foundation will automatically guide your catalogue pricing engine when listing products.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: WORKSHOP LOCATION & PRESENCE */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 1-Click GPS Auto-Fill Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <MapPin className="w-4 h-4 text-artisan-400" />
                  <span>Auto-detect Workshop Address from GPS</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click to automatically fill your studio street, city, state, and PIN code.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={handleCaptureLocation}
                disabled={isLocating}
                className="shrink-0 text-xs bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold"
              >
                <Navigation className={`w-3.5 h-3.5 mr-1.5 ${isLocating ? "animate-spin" : ""}`} />
                {isLocating ? "Detecting Address..." : "Detect Workshop Location"}
              </Button>
            </div>

            {/* Status Badge upon successful detection */}
            {city && stateName && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Location Verified:</strong> {city}, {stateName} {pincode ? `(${pincode})` : ""}
                </span>
              </div>
            )}

            {/* Workshop Street Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Workshop / Studio Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Ward 3, North Zone, Near River Bank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City / Town / Village *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State *
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PIN Code (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 641001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer / Navigation */}
      <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950">
        <div>
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Step
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="text-xs"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              className="text-xs bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Save & Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
