"use client";

import React, { useState } from "react";
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
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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
  Info,
  Layers,
  BookOpen,
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
    desc: "Solo craftsperson creating handcrafted goods directly",
  },
  {
    label: "Family Workshop",
    value: "family_business",
    desc: "Family-run traditional craft unit passing down heritage skills",
  },
  {
    label: "Artisan Cooperative",
    value: "cooperative",
    desc: "Registered artisan cooperative pooling collective production",
  },
  {
    label: "Self-Help Group (SHG)",
    value: "self_help_group",
    desc: "Community or women's artisan producer group",
  },
  {
    label: "Rural Producer Group",
    value: "rural_producer_group",
    desc: "Cluster of village craftsmen collaborating on bulk orders",
  },
  {
    label: "Small Retailer / Aggregator",
    value: "small_retail",
    desc: "Local merchant marketing and selling artisan goods",
  },
];

const WORKSPACE_TYPES: { label: string; value: WorkspaceType; desc: string }[] = [
  {
    label: "Home Workshop",
    value: "home_workshop",
    desc: "Traditional workspace set up at home or courtyard",
  },
  {
    label: "Dedicated Studio",
    value: "dedicated_studio",
    desc: "Independent craft workshop or production shed",
  },
  {
    label: "Community Craft Shed",
    value: "community_shed",
    desc: "Shared village cluster workspace with shared tools",
  },
  {
    label: "Cooperative Center",
    value: "cooperative_center",
    desc: "Formal processing and weaving/production center",
  },
];

export function SellerProfileWizard({
  initialProfile,
  isOpen,
  onClose,
  onSuccess,
}: SellerProfileWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [artisanName, setArtisanName] = useState(initialProfile?.artisan_name || "");
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || "");
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

  // Capacity & Workspace
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

  // Location
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
  React.useEffect(() => {
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

        // Auto-fill address fields via reverse geocoding
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

            const detectedCity =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.suburb ||
              "";
            const detectedDistrict =
              addr.state_district ||
              addr.county ||
              addr.district ||
              "";
            const detectedState = addr.state || "";
            const detectedPincode = addr.postcode ? addr.postcode.replace(/\D/g, "").slice(0, 6) : "";

            const streetParts = [
              addr.house_number,
              addr.building,
              addr.road,
              addr.neighbourhood,
              addr.suburb,
            ].filter(Boolean);

            const detectedStreet =
              streetParts.length > 0
                ? streetParts.join(", ")
                : data.display_name?.split(",").slice(0, 2).join(",") || "";

            if (detectedStreet) setAddress(detectedStreet);
            if (detectedCity) setCity(detectedCity);
            if (detectedDistrict) setDistrict(detectedDistrict);
            if (detectedState) setStateName(detectedState);
            if (detectedPincode) setPincode(detectedPincode);
          }
        } catch (geocodeErr) {
          console.warn("Reverse geocoding error:", geocodeErr);
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
      experience_years: Number(experienceYears) || 1,
      seller_type: sellerType,
      workspace_type: workspaceType,
      number_of_workers: Math.max(1, Number(numberOfWorkers) || 1),
      daily_labour_rate_inr: Math.max(0, Number(dailyLabourRate) || 400),
      daily_capacity_units: Math.max(1, Number(dailyCapacityUnits) || 5),
      lead_time_days: Math.max(0, Number(leadTimeDays) || 3),
      location: locationObj,
      is_onboarded: true,
    };

    try {
      const updated = await api.updateSellerProfile(payload);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Unit labor cost preview calculation
  const computedUnitLaborCost =
    dailyCapacityUnits > 0
      ? ((dailyLabourRate * numberOfWorkers) / dailyCapacityUnits).toFixed(0)
      : "0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <Card className="max-w-2xl w-full bg-slate-900 border-slate-800 shadow-2xl p-0 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-artisan-500/20 text-artisan-400 flex items-center justify-center border border-artisan-500/30">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Artisan Studio & Workspace Profile
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-artisan-500/20 text-artisan-300 border border-artisan-500/30">
                  Stage 1
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set up your craft domain, workshop capacity, and location for buyer matching.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 1
                ? "border-artisan-500 text-artisan-400 bg-artisan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Craft & Story</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 2
                ? "border-artisan-500 text-artisan-400 bg-artisan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Workshop & Capacity</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              step === 3
                ? "border-artisan-500 text-artisan-400 bg-artisan-500/5"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Location & Presence</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CRAFT & STORY */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Artisan / Lead Name *
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
                    Studio / Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Ganga Terracotta Studio"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Craft Domain *
                  </label>
                  <select
                    value={craftCategory}
                    onChange={(e) => setCraftCategory(e.target.value as CraftCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500 cursor-pointer"
                  >
                    {CRAFT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Craft Specialties & Products (comma separated)
                </label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="e.g. Storage Baskets, Dining Table Mats, Floor Lamps"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Artisan Structure / Producer Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SELLER_TYPES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setSellerType(st.value)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        sellerType === st.value
                          ? "bg-artisan-500/15 border-artisan-500 text-artisan-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-200 flex items-center justify-between">
                        <span>{st.label}</span>
                        {sellerType === st.value && (
                          <Check className="w-3.5 h-3.5 text-artisan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {st.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Artisan Story & Heritage Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell buyers about your craftsmanship heritage, traditional techniques, natural materials used, and community..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* STEP 2: WORKSPACE & CAPACITY */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workspace Environment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WORKSPACE_TYPES.map((wt) => (
                    <button
                      key={wt.value}
                      type="button"
                      onClick={() => setWorkspaceType(wt.value)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        workspaceType === wt.value
                          ? "bg-artisan-500/15 border-artisan-500 text-artisan-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-200 flex items-center justify-between">
                        <span>{wt.label}</span>
                        {workspaceType === wt.value && (
                          <Check className="w-3.5 h-3.5 text-artisan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {wt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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

          {/* STEP 3: LOCATION & PRESENCE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <MapPin className="w-4 h-4 text-artisan-400" />
                    <span>Live GPS Location Capture (§12 Verification)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {latitude && longitude
                      ? `Coordinates: ${latitude}, ${longitude}`
                      : "Capture your workshop coordinates for regional buyer discovery & trust verification."}
                  </p>
                  {latitude && city && (
                    <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Auto-filled address from GPS: {city}, {stateName} ({pincode || "PIN"})
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={latitude ? "outline" : "primary"}
                  onClick={handleCaptureLocation}
                  disabled={isLocating}
                  className="shrink-0"
                >
                  <Navigation className={`w-3.5 h-3.5 mr-1.5 ${isLocating ? "animate-spin" : ""}`} />
                  {isLocating ? "Locating & Reverse Geocoding..." : latitude ? "Update GPS & Address" : "Capture GPS Location"}
                </Button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workshop / Studio Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Traditional Craft Cluster, Near River Bank"
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
                    placeholder="e.g. Varanasi / Guwahati / Jaipur"
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
                    placeholder="e.g. Kamrup / Varanasi"
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
                    placeholder="e.g. Assam, Uttar Pradesh, Rajasthan"
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
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 781001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                  />
                </div>
              </div>

              {/* Trust Verification Summary */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 space-y-1">
                  <p className="font-semibold text-emerald-300">
                    Trust & Verification Level
                  </p>
                  <p className="text-slate-400">
                    Completing your workshop details and capturing verified GPS coordinates unlocks verified status and boosts your studio trust score to <strong>85%+</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as any)}
                disabled={isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((s) => (s + 1) as any)}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold px-5"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isSaving ? "Saving Studio..." : "Save & Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
