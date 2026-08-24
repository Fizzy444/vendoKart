"use client";

import React, { useState, useEffect, useRef } from "react";
import { CraftCategory, SellerProfile } from "@/types/seller";
import { Product, ProductCreatePayload } from "@/types/product";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Hammer,
  Sparkles,
  Package,
  IndianRupee,
  Layers,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Image as ImageIcon,
  Calculator,
  Tag,
  Boxes,
  HelpCircle,
  Upload,
  Camera,
  Trash2,
} from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
  sellerProfile?: SellerProfile | null;
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

export function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
  sellerProfile,
}: AddProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [craftCategory, setCraftCategory] = useState<CraftCategory>(
    sellerProfile?.craft_category || "Bamboo Craft"
  );
  const [craftSpecialty, setCraftSpecialty] = useState(
    sellerProfile?.craft_specialties?.[0] || ""
  );
  const [materialType, setMaterialType] = useState("Natural Raw Bamboo / Wood");
  
  // Cost & Production inputs
  const [materialCost, setMaterialCost] = useState<number>(180);
  const [labourRate, setLabourRate] = useState<number>(
    sellerProfile?.daily_labour_rate_inr ?? 450
  );
  const [workersCount, setWorkersCount] = useState<number>(
    sellerProfile?.number_of_workers ?? 1
  );
  const [dailyCapacity, setDailyCapacity] = useState<number>(
    sellerProfile?.daily_capacity_units ?? 5
  );
  const [productionDays, setProductionDays] = useState<number>(1);
  const [packagingCost, setPackagingCost] = useState<number>(25);
  const [targetMargin, setTargetMargin] = useState<number>(25);

  // Inventory & Customization
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(
    sellerProfile?.lead_time_days ?? 3
  );
  const [isCustomizable, setIsCustomizable] = useState<boolean>(true);
  const [tagsInput, setTagsInput] = useState("handmade, traditional, eco-friendly");
  
  // User Provided Image State
  const [productImageUrl, setProductImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Live Deterministic Pricing Calculations (§11)
  const unitLabourCost =
    dailyCapacity > 0 ? (workersCount * labourRate) / dailyCapacity : 0;
  const totalUnitCost = Math.round(materialCost + unitLabourCost + packagingCost);
  const minFloorPrice = Math.ceil(totalUnitCost * 1.10);
  const recommendedPrice = Math.ceil(totalUnitCost * (1 + targetMargin / 100));
  const estimatedProfit = recommendedPrice - totalUnitCost;

  // Sync defaults when sellerProfile loads
  useEffect(() => {
    if (sellerProfile) {
      if (sellerProfile.craft_category) setCraftCategory(sellerProfile.craft_category);
      if (sellerProfile.daily_labour_rate_inr) setLabourRate(sellerProfile.daily_labour_rate_inr);
      if (sellerProfile.number_of_workers) setWorkersCount(sellerProfile.number_of_workers);
      if (sellerProfile.daily_capacity_units) setDailyCapacity(sellerProfile.daily_capacity_units);
      if (sellerProfile.lead_time_days) setLeadTimeDays(sellerProfile.lead_time_days);
    }
  }, [sellerProfile]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProductImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProductImageUrl(val);
    setImagePreview(val.trim() || null);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setProductImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please provide a product title.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please write a short product description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const activeImage = productImageUrl.trim();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload: ProductCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      craft_category: craftCategory,
      craft_specialty: craftSpecialty.trim() || undefined,
      material_type: materialType.trim() || "Traditional Raw Materials",
      material_cost_inr: Math.max(0, materialCost),
      labour_daily_rate_inr: Math.max(0, labourRate),
      workers_count: Math.max(1, workersCount),
      daily_capacity_units: Math.max(0.1, dailyCapacity),
      production_days: Math.max(1, productionDays),
      packaging_cost_inr: Math.max(0, packagingCost),
      target_margin_percent: Math.max(5, targetMargin),
      stock_quantity: Math.max(0, stockQuantity),
      lead_time_days: Math.max(0, leadTimeDays),
      is_customizable: isCustomizable,
      images: activeImage ? [activeImage] : [],
      tags,
      status: "published",
    };

    try {
      const created = await api.createProduct(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to publish product listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-200">
      {/* Card Header */}
      <div className="p-6 sm:p-7 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center border border-artisan-500/20 shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              List Handcrafted Product for Sale
            </h2>
            <p className="text-xs text-slate-400">
              Stage 1 — Calculate fair production costs with deterministic pricing and publish to marketplace.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          title="Close Form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 1: Basic Craft Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-artisan-400 flex items-center gap-1.5">
            <Hammer className="w-3.5 h-3.5" /> 1. Craft Details & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Handwoven Bamboo Hanging Pendant Lamp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Craft Category *
              </label>
              <select
                value={craftCategory}
                onChange={(e) => setCraftCategory(e.target.value as CraftCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              >
                {CRAFT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Craft Specialty / Product Type
              </label>
              <input
                type="text"
                value={craftSpecialty}
                onChange={(e) => setCraftSpecialty(e.target.value)}
                placeholder="e.g. Ambient Lighting & Lanterns"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Traditional Materials Used
              </label>
              <input
                type="text"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                placeholder="e.g. Seasoned River Bamboo, Jute Cord, Eco Varnish"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Artisan Description & Technique Story *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this piece was crafted, tools used, generational techniques, and care instructions..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500 resize-none"
            />
          </div>
        </div>

        {/* Section 2: User Provided Product Photo */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-artisan-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> 2. Product Photo (Upload or Link)
          </h3>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-artisan-500/70 rounded-2xl p-6 text-center bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-artisan-500/10 text-artisan-400 mx-auto flex items-center justify-center border border-artisan-500/20 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to upload product photo from device
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </div>
            </div>

            {/* Preview or URL Input Box */}
            <div className="space-y-2">
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 h-32 flex items-center justify-center group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 rounded-xl bg-red-500 text-white text-xs font-semibold flex items-center gap-1 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-32 rounded-2xl border border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                  <Camera className="w-6 h-6 mb-1 text-slate-600" />
                  <span className="text-[11px]">No image selected yet</span>
                </div>
              )}

              <div>
                <input
                  type="url"
                  value={productImageUrl.startsWith("data:") ? "" : productImageUrl}
                  onChange={handleUrlChange}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Deterministic Pricing Engine (§11 Formulas) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> 3. Deterministic Pricing Parameters (§11 Math)
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500" /> Non-negotiable floor calculation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-400" /> Raw Material Cost (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={materialCost}
                onChange={(e) => setMaterialCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Cost of clay/bamboo/fabric per unit</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-400" /> Daily Labour Wage (L)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={labourRate}
                onChange={(e) => setLabourRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Fair daily wage rate per artisan</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" /> Daily Output Capacity (U)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Units finished per day per worker</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-400" /> Packaging & Box Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Profit Margin: <strong className="text-emerald-400">{targetMargin}%</strong>
                </label>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10% (Low)</span>
                <span>25% (Standard Fair)</span>
                <span>60% (Premium)</span>
              </div>
            </div>
          </div>

          {/* Live Pricing Breakdown Card (§11 Math Formula) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-artisan-950/40 border border-emerald-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Computed Fair Price Engine Summary
                </span>
              </div>
              <Badge variant="success" size="sm">
                Deterministic §11 Math
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400">Unit Labour Cost:</span>
                <p className="font-bold text-slate-200 mt-0.5">₹{unitLabourCost.toFixed(0)} / piece</p>
                <span className="text-[9px] text-slate-500">(₹{labourRate}/day ÷ {dailyCapacity} units)</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Total Unit Cost:</span>
                <p className="font-bold text-slate-200 mt-0.5">₹{totalUnitCost} / piece</p>
                <span className="text-[9px] text-slate-500">(Material + Labour + Pkg)</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">Guaranteed Floor:</span>
                <p className="font-bold text-amber-400 mt-0.5">₹{minFloorPrice} / piece</p>
                <span className="text-[9px] text-amber-500/80">(Never sell below this)</span>
              </div>

              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                <span className="text-[11px] text-emerald-300 font-semibold">Recommended (Single Item):</span>
                <p className="text-base font-extrabold text-emerald-400 mt-0.5">₹{recommendedPrice} <span className="text-xs font-medium text-emerald-300">/ piece</span></p>
                <span className="text-[9px] text-emerald-400/80 font-medium">+₹{estimatedProfit} profit / piece</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Inventory & Fulfillment */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-artisan-400 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" /> 4. Stock Inventory & Fulfillment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ready Stock Quantity (Units)
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lead Time (Days for New Batch)
              </label>
              <input
                type="number"
                min="0"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Discovery Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-artisan-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={isCustomizable}
              onChange={(e) => setIsCustomizable(e.target.checked)}
              className="rounded accent-artisan-500 w-4 h-4 bg-slate-950 border-slate-700"
            />
            <span>Accept buyer customization requests (custom dimensions, personalized colors & engravings)</span>
          </label>
        </div>

        {/* Card Footer / Publish Action */}
        <div className="p-6 -mx-6 -mb-6 mt-6 border-t border-slate-800 flex items-center justify-between bg-slate-950 rounded-b-3xl">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Publish Listing at ₹{recommendedPrice} / piece
          </Button>
        </div>
      </form>
    </div>
  );
}
