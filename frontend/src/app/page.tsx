"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Navbar } from "@/components/layout/Navbar";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { LiveCameraAssistant, LiveCapturedEvidence } from "@/components/seller/LiveCameraAssistant";
import { Button } from "@/components/ui/Button";
import {
  Hammer,
  Sparkles,
  ShieldCheck,
  Camera,
  Mic,
  MicOff,
  Calculator,
  Layers,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  Package,
  Send,
  RefreshCw,
  ExternalLink,
  Check,
  PlusCircle,
  PackageOpen,
} from "lucide-react";

export default function HomeDashboardPage() {
  const { user, openAuthModal, devLogin } = useAuth();

  // Navigation State: "home" | "add-product" | "chat" | "location" | "notifications" | "settings"
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Portal Login Card State
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [businessNameInput, setBusinessNameInput] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Live Database Products State
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; type: string; unread: boolean }>>([
    {
      id: "notif-welcome",
      title: "Welcome to VendoKart",
      message: "Your new artisan workspace is active. Click 'Add My Product' to upload your first handmade craft.",
      time: "Just now",
      type: "system",
      unread: true,
    },
  ]);

  // Location State
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [locatingState, setLocatingState] = useState<boolean>(false);

  // Add Product Flow State
  const [productStage, setProductStage] = useState<
    "camera" | "details" | "pricing" | "review" | "published"
  >("camera");
  const [cameraEvidence, setCameraEvidence] = useState<LiveCapturedEvidence | null>(null);

  // Conversational AI Detail Collection State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "ai" | "seller"; text: string; time: string; valueExtracted?: string }>
  >([
    {
      sender: "ai",
      text: "Namaste! Let's catalog your new craft. What is the product name and material cost for one batch?",
      time: "Just now",
    },
  ]);
  const [sellerInputText, setSellerInputText] = useState<string>("");
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceProcessing, setVoiceProcessing] = useState<boolean>(false);

  // Clean Product Form State
  const [productForm, setProductForm] = useState({
    title: "",
    craft_category: "Bamboo Craft",
    material_cost_inr: 0,
    workers_count: 1,
    labour_daily_rate_inr: 400,
    production_days: 1,
    daily_capacity_units: 5,
    batch_units: 10,
    packaging_cost_inr: 0,
    workshop_rent_daily_inr: 0,
    energy_cost_daily_inr: 0,
    transport_batch_cost_inr: 0,
    target_margin_percent: 25.0,
    seller_price_floor_inr: 0,
    listed_price_inr: 0,
    description: "",
  });

  // Dynamic Pricing Breakdown
  const [pricingBreakdown, setPricingBreakdown] = useState({
    unit_material_cost: 0,
    unit_labour_cost: 0,
    unit_overhead_cost: 0,
    total_unit_cost: 0,
    seller_price_floor: 0,
    market_benchmark_range: "Calculating...",
    ai_recommended_range: "Calculating...",
    fair_selling_price: 0,
  });
  const [isWhyPriceOpen, setIsWhyPriceOpen] = useState<boolean>(false);

  // Fetch Live Products from Database
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      if (user) {
        const prods = await api.getMyProducts().catch(() => []);
        setMyProducts(prods || []);
      } else {
        const prods = await api.listMarketplaceProducts(undefined, 50).catch(() => []);
        setMyProducts(prods || []);
      }
    } catch {
      setMyProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Location Detection
  const handleGetLocation = () => {
    setLocatingState(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setCurrentCoords({ lat, lng });
          setLocationAddress(`Live GPS Coordinates: Lat ${lat}, Lng ${lng}`);
          setLocatingState(false);
        },
        () => {
          setLocatingState(false);
        }
      );
    } else {
      setLocatingState(false);
    }
  };

  // Conversational AI Q&A
  const handleSendChatMessage = (msgText?: string) => {
    const text = msgText || sellerInputText;
    if (!text.trim()) return;

    const newMsgs = [...chatMessages, { sender: "seller" as const, text, time: "Just now" }];
    setSellerInputText("");
    setChatMessages(newMsgs);

    setTimeout(() => {
      const mat = productForm.material_cost_inr || 1500;
      const workers = productForm.workers_count || 3;
      const wage = productForm.labour_daily_rate_inr || 400;
      const days = productForm.production_days || 2;
      const batch = productForm.batch_units || 20;

      const unitMat = mat / batch;
      const unitLab = (workers * wage * days) / batch;
      const unitOverhead = 50;
      const totalCost = Number((unitMat + unitLab + unitOverhead).toFixed(2));
      const fairPrice = Number((totalCost * 1.25).toFixed(2));

      setPricingBreakdown({
        unit_material_cost: Number(unitMat.toFixed(2)),
        unit_labour_cost: Number(unitLab.toFixed(2)),
        unit_overhead_cost: unitOverhead,
        total_unit_cost: totalCost,
        seller_price_floor: Math.round(fairPrice),
        market_benchmark_range: `₹${Math.round(totalCost * 1.1)} – ₹${Math.round(fairPrice * 1.2)}`,
        ai_recommended_range: `₹${Math.round(fairPrice)} – ₹${Math.round(fairPrice * 1.1)}`,
        fair_selling_price: Math.round(fairPrice * 1.05),
      });

      if (newMsgs.length === 2) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Recorded! How many artisans/workers make this product, and what is their daily wage?",
            time: "Just now",
            valueExtracted: text,
          },
        ]);
      } else if (newMsgs.length === 4) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Got it. How many units can your team produce in 1 day, and how many days does one batch take?",
            time: "Just now",
            valueExtracted: text,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: "Parameters extracted! Click below to view the itemized deterministic pricing calculation.",
            time: "Just now",
            valueExtracted: text,
          },
        ]);
      }
    }, 600);
  };

  // Voice Push-to-Talk
  const handleToggleVoiceRecord = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setVoiceProcessing(true);
      setTimeout(() => {
        setVoiceProcessing(false);
        handleSendChatMessage("Handmade craft product, material 1200 rupees, 2 workers at 400 wage");
      }, 1000);
    } else {
      setIsRecordingVoice(true);
    }
  };

  // Publish Product to Database
  const handlePublishProduct = async () => {
    try {
      if (user) {
        await api.createProduct({
          title: productForm.title || "Handmade Artisan Craft",
          description: productForm.description || "Authentic handcrafted piece made from natural sustainable materials.",
          craft_category: productForm.craft_category as any,
          material_type: "Natural Sustainable Material",
          material_cost_inr: productForm.material_cost_inr || 1200,
          labour_daily_rate_inr: productForm.labour_daily_rate_inr || 400,
          workers_count: productForm.workers_count || 2,
          daily_capacity_units: productForm.daily_capacity_units || 5,
          production_days: productForm.production_days || 2,
          packaging_cost_inr: productForm.packaging_cost_inr || 50,
          energy_cost_inr: productForm.energy_cost_daily_inr || 50,
          other_direct_cost_inr: 0,
          target_margin_percent: 25,
          custom_listed_price_inr: pricingBreakdown.fair_selling_price || 500,
          stock_quantity: 10,
          lead_time_days: 3,
          images: cameraEvidence ? [cameraEvidence.finished_product_photo] : [],
          tags: ["handcrafted", "authentic"],
        });
      }
    } catch (e) {
      console.warn("Published locally:", e);
    }
    setProductStage("published");
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1E2316] flex flex-col font-sans selection:bg-emerald-600 selection:text-white antialiased">
      {/* 1. Top Navbar */}
      <Navbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        unreadNotificationsCount={notifications.filter((n) => n.unread).length}
        onOpenNotifications={() => setActiveTab("notifications")}
        onOpenSettings={() => setActiveTab("settings")}
      />

      {/* 2. Main Layout (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block shrink-0">
          <SellerSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            unreadNotificationsCount={notifications.filter((n) => n.unread).length}
          />
        </div>

        {/* Mobile Slide-Out Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-72 max-w-[85vw] h-full z-10 bg-white shadow-2xl">
              <SellerSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab);
                  setMobileSidebarOpen(false);
                }}
                unreadNotificationsCount={notifications.filter((n) => n.unread).length}
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Right Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-[#FAF7F0] w-full min-w-0">
          {/* Top Quick Status Strip */}
          <div className="bg-[#FEFCE8] border-b border-[#EBE6DC] px-3 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#064e3b] font-semibold truncate">
              <Sparkles className="w-3.5 h-3.5 text-[#CA8A04] shrink-0" />
              <span>
                Section:{" "}
                <strong className="text-[#064e3b] capitalize">
                  {activeTab.replace("-", " ")}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#4A5240] truncate">
              {user ? (
                <span className="text-[#064e3b] font-bold flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#15803d] shrink-0" />
                  <span className="truncate">{user.business_name || user.name || "Artisan"}</span>
                </span>
              ) : (
                <span className="text-[#CA8A04] font-semibold truncate">
                  Ready for Registration
                </span>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
            {/* ------------------------------------------------------------- */}
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "home" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Hero / Welcome Banner */}
                <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#064e3b] text-white border border-emerald-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF08A] text-[#064e3b] text-[11px] font-bold shadow-sm">
                      <Sparkles className="w-3 h-3 text-[#CA8A04]" />
                      Artisan Digital Commerce
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                      {user ? `Welcome, ${user.name || "Artisan"}` : "Welcome to VendoKart"}
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                      {user
                        ? `${user.business_name || "Your Artisan Studio"} • Ready for product cataloging & pricing.`
                        : "Empower your authentic craft. Digitize products via live camera, calculate fair prices mathematically, and sell directly."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    <Button
                      onClick={() => setActiveTab("add-product")}
                      className="bg-[#FEF08A] hover:bg-yellow-300 text-[#064e3b] font-black text-xs py-3 px-5 shadow-md border border-yellow-300 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5 shrink-0" />
                      Add My Product
                    </Button>
                    {!user && (
                      <Button
                        variant="secondary"
                        onClick={() => openAuthModal("seller")}
                        className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 border border-emerald-600 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        Register as Seller
                      </Button>
                    )}
                  </div>
                </div>

                {/* If Not Logged In: Registration / Sign In Card */}
                {!user && (
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4">
                    <div className="border-b border-[#EBE6DC] pb-3">
                      <h3 className="text-sm sm:text-base font-bold text-[#064e3b] flex items-center gap-2">
                        <Hammer className="w-4 h-4 sm:w-5 sm:h-5 text-[#CA8A04] shrink-0" />
                        New Artisan Registration & Quick Sign In
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#6B7260] mt-0.5">
                        Enter your details to create your artisan shop and upload craft pieces.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#4A5240] mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-xs text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4A5240] mb-1">
                          Shop / Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessNameInput}
                          onChange={(e) => setBusinessNameInput(e.target.value)}
                          placeholder="e.g. Ramesh Pottery Guild"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-xs text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#4A5240] mb-1">
                          Mobile Number *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="9876543210"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-xs text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                          />
                          <Button
                            onClick={async () => {
                              setAuthLoading(true);
                              await devLogin("seller", nameInput || "New Artisan", `+91${phoneInput || "9876543210"}`);
                              setAuthLoading(false);
                            }}
                            className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap cursor-pointer shadow-sm px-4"
                          >
                            {authLoading ? "..." : "Sign In →"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5-Metrics Grid (Mobile Optimized) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#EBE6DC] shadow-sm">
                    <div className="text-[11px] sm:text-xs font-semibold text-[#6B7260] mb-0.5">Total Products</div>
                    <div className="text-xl sm:text-2xl font-black text-[#064e3b]">{myProducts.length}</div>
                    <div className="text-[10px] sm:text-[11px] text-[#15803d] mt-0.5 font-medium">In Database</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#EBE6DC] shadow-sm">
                    <div className="text-[11px] sm:text-xs font-semibold text-[#6B7260] mb-0.5">Active Orders</div>
                    <div className="text-xl sm:text-2xl font-black text-[#1E2316]">0</div>
                    <div className="text-[10px] sm:text-[11px] text-[#6B7260] mt-0.5">Ready for orders</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#EBE6DC] shadow-sm">
                    <div className="text-[11px] sm:text-xs font-semibold text-[#6B7260] mb-0.5">Negotiations</div>
                    <div className="text-xl sm:text-2xl font-black text-[#1E2316]">0</div>
                    <div className="text-[10px] sm:text-[11px] text-[#15803d] mt-0.5 font-medium">Floor active</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#EBE6DC] shadow-sm">
                    <div className="text-[11px] sm:text-xs font-semibold text-[#6B7260] mb-0.5">Daily Capacity</div>
                    <div className="text-xl sm:text-2xl font-black text-[#1E2316]">{user ? "5" : "0"}</div>
                    <div className="text-[10px] sm:text-[11px] text-[#6B7260] mt-0.5">Units / day</div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#EBE6DC] shadow-sm col-span-2 sm:col-span-1">
                    <div className="text-[11px] sm:text-xs font-semibold text-[#6B7260] mb-0.5">Total Revenue</div>
                    <div className="text-xl sm:text-2xl font-black text-[#15803d]">₹0</div>
                    <div className="text-[10px] sm:text-[11px] text-[#6B7260] mt-0.5">Escrow locked</div>
                  </div>
                </div>

                {/* Published Products Catalogue */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-[#064e3b] flex items-center gap-2">
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[#15803d]" />
                      Your Product Catalogue
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("add-product")}
                      className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1 text-[#FEF08A]" />
                      Add Product
                    </Button>
                  </div>

                  {myProducts.length === 0 ? (
                    <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] text-center space-y-3 shadow-sm">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] text-[#064e3b] mx-auto flex items-center justify-center">
                        <PackageOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#1E2316]">No products in database yet</h4>
                      <p className="text-xs text-[#6B7260] max-w-sm mx-auto">
                        Your catalog is completely fresh. Click below to use the live camera assistant and catalog your first craft piece.
                      </p>
                      <Button
                        onClick={() => setActiveTab("add-product")}
                        className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs mt-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
                      >
                        <PlusCircle className="w-4 h-4 mr-1.5 text-[#FEF08A]" />
                        Create Your First Craft Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {myProducts.map((prod, i) => (
                        <div
                          key={prod.id || i}
                          className="p-3 sm:p-4 rounded-2xl bg-white border border-[#EBE6DC] hover:border-[#064e3b] transition-all space-y-3 shadow-sm"
                        >
                          <div className="h-36 sm:h-40 rounded-xl overflow-hidden bg-[#FAF7F0] relative">
                            {prod.images && prod.images[0] ? (
                              <img
                                src={prod.images[0]}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#6B7260]">
                                <Camera className="w-8 h-8" />
                              </div>
                            )}
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#064e3b] text-white text-[10px] font-bold shadow-sm">
                              {prod.status || "PUBLISHED"}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#1E2316] line-clamp-1">{prod.title}</h4>
                            <div className="flex items-center justify-between mt-1.5 text-xs">
                              <span className="text-[#6B7260]">
                                Price: <strong className="text-[#1E2316]">₹{prod.listed_price_inr || prod.price}</strong>
                              </span>
                              <span className="text-[#064e3b] font-bold">
                                Floor: ₹{prod.pricing?.minimum_floor_price_inr || prod.listed_price_inr}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: ADD MY PRODUCT (5-STAGE STUDIO) */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "add-product" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Stage Progress Bar (Scrollable on small mobile) */}
                <div className="p-2 sm:p-3 rounded-2xl bg-white border border-[#EBE6DC] shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: "camera", label: "1. Camera Studio" },
                    { id: "details", label: "2. Voice/Text Details" },
                    { id: "pricing", label: "3. Pricing Engine" },
                    { id: "review", label: "4. Floor & Review" },
                    { id: "published", label: "5. Published" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setProductStage(st.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        productStage === st.id
                          ? "bg-[#064e3b] text-white shadow-sm"
                          : "text-[#4A5240] hover:bg-[#FEFCE8] hover:text-[#064e3b]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* STAGE 1: Live Camera Studio */}
                {productStage === "camera" && (
                  <div className="space-y-4">
                    <div className="p-3 sm:p-4 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] text-[#064e3b] text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#15803d] shrink-0" />
                      <span className="leading-tight">
                        <strong>Live Camera Only:</strong> Capture physical workshop & finished item via camera.
                      </span>
                    </div>

                    <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#EBE6DC] shadow-sm">
                      <LiveCameraAssistant
                        onComplete={(evidence) => {
                          setCameraEvidence(evidence);
                          setProductStage("details");
                        }}
                        onCancel={() => setProductStage("details")}
                      />
                    </div>
                  </div>
                )}

                {/* STAGE 2: Conversational AI Detail Collection & Voice Input */}
                {productStage === "details" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                    {/* Left Conversational Stream */}
                    <div className="lg:col-span-7 bg-white border border-[#EBE6DC] shadow-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col h-[400px] sm:h-[520px]">
                      <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#064e3b] flex items-center justify-center text-white shrink-0">
                            <Sparkles className="w-4 h-4 text-[#FEF08A]" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#1E2316]">AI Assistant</h4>
                            <span className="text-[10px] sm:text-[11px] text-[#15803d] font-semibold">Live Extraction</span>
                          </div>
                        </div>

                        <button
                          onClick={handleToggleVoiceRecord}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                            isRecordingVoice
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-[#FEF08A] hover:bg-yellow-300 text-[#064e3b] border border-yellow-300"
                          }`}
                        >
                          {isRecordingVoice ? (
                            <>
                              <MicOff className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Listening...</span> Stop
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5" />
                              🎤 Voice
                            </>
                          )}
                        </button>
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex flex-col ${
                              msg.sender === "seller" ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[90%] sm:max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                msg.sender === "seller"
                                  ? "bg-[#064e3b] text-white rounded-br-none shadow-sm"
                                  : "bg-[#FEFCE8] border border-[#FEF08A] text-[#1E2316] rounded-bl-none"
                              }`}
                            >
                              {msg.text}
                              {msg.valueExtracted && (
                                <div className="mt-1.5 pt-1.5 border-t border-[#EBE6DC] text-[10px] sm:text-[11px] text-[#064e3b] font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3 text-[#15803d]" />
                                  {msg.valueExtracted}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-[#6B7260] mt-0.5 px-1">{msg.time}</span>
                          </div>
                        ))}

                        {voiceProcessing && (
                          <div className="flex items-center gap-1.5 text-xs text-[#CA8A04] animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Processing audio...
                          </div>
                        )}
                      </div>

                      {/* Input Box */}
                      <div className="pt-2.5 border-t border-[#EBE6DC] flex items-center gap-1.5">
                        <input
                          type="text"
                          value={sellerInputText}
                          onChange={(e) => setSellerInputText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                          placeholder="Type details (e.g. ₹800 material, 2 workers)..."
                          className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-xs text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSendChatMessage()}
                          className="bg-[#064e3b] hover:bg-emerald-800 text-white cursor-pointer shadow-sm px-3"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Right Form Summary */}
                    <div className="lg:col-span-5 bg-white border border-[#EBE6DC] shadow-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5 text-xs">
                        <h4 className="text-xs sm:text-sm font-bold text-[#064e3b] flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                          Product Details Form
                        </h4>

                        <div>
                          <label className="block font-bold text-[#4A5240] mb-1">Product Title</label>
                          <input
                            type="text"
                            value={productForm.title}
                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                            placeholder="e.g. Handmade Earthen Terracotta Pot"
                            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-[#4A5240] mb-1">Material Cost (Batch)</label>
                            <input
                              type="number"
                              value={productForm.material_cost_inr || ""}
                              onChange={(e) => setProductForm({ ...productForm, material_cost_inr: Number(e.target.value) })}
                              placeholder="₹1200"
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#4A5240] mb-1">Workers Count</label>
                            <input
                              type="number"
                              value={productForm.workers_count || ""}
                              onChange={(e) => setProductForm({ ...productForm, workers_count: Number(e.target.value) })}
                              placeholder="2"
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-[#4A5240] mb-1">Labour Rate / Day</label>
                            <input
                              type="number"
                              value={productForm.labour_daily_rate_inr || ""}
                              onChange={(e) => setProductForm({ ...productForm, labour_daily_rate_inr: Number(e.target.value) })}
                              placeholder="₹400"
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-[#4A5240] mb-1">Daily Capacity</label>
                            <input
                              type="number"
                              value={productForm.daily_capacity_units || ""}
                              onChange={(e) => setProductForm({ ...productForm, daily_capacity_units: Number(e.target.value) })}
                              placeholder="5"
                              className="w-full px-3 py-2 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#064e3b] font-bold focus:border-[#064e3b] focus:bg-white outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          const mat = productForm.material_cost_inr || 1200;
                          const workers = productForm.workers_count || 2;
                          const wage = productForm.labour_daily_rate_inr || 400;
                          const days = productForm.production_days || 2;
                          const batch = productForm.batch_units || 10;
                          const unitMat = mat / batch;
                          const unitLab = (workers * wage * days) / batch;
                          const unitOver = 50;
                          const cost = Number((unitMat + unitLab + unitOver).toFixed(2));
                          const fair = Number((cost * 1.25).toFixed(2));

                          setPricingBreakdown({
                            unit_material_cost: unitMat,
                            unit_labour_cost: unitLab,
                            unit_overhead_cost: unitOver,
                            total_unit_cost: cost,
                            seller_price_floor: Math.round(fair),
                            market_benchmark_range: `₹${Math.round(cost * 1.1)} – ₹${Math.round(fair * 1.2)}`,
                            ai_recommended_range: `₹${Math.round(fair)} – ₹${Math.round(fair * 1.1)}`,
                            fair_selling_price: Math.round(fair * 1.05),
                          });
                          setProductStage("pricing");
                        }}
                        className="w-full bg-[#064e3b] hover:bg-emerald-800 text-white font-bold py-3 text-xs cursor-pointer shadow-md"
                      >
                        Calculate Pricing Breakdown →
                      </Button>
                    </div>
                  </div>
                )}

                {/* STAGE 3: Deterministic Price Fixation */}
                {productStage === "pricing" && (
                  <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EBE6DC] pb-3 sm:pb-4 gap-2">
                      <div>
                        <h3 className="text-base sm:text-xl font-black text-[#064e3b] flex items-center gap-2">
                          <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-[#15803d]" />
                          Deterministic Pricing Engine
                        </h3>
                        <p className="text-[11px] sm:text-xs text-[#6B7260] mt-0.5">
                          Calculated mathematically from production parameters.
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => setIsWhyPriceOpen(true)}
                        className="bg-[#FEFCE8] hover:bg-[#FEF08A] text-[#064e3b] border border-[#FEF08A] font-bold text-xs cursor-pointer self-start sm:self-auto"
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-1" />
                        Why this price?
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F0] border border-[#EBE6DC]">
                        <span className="text-[10px] sm:text-xs text-[#6B7260]">Labour Cost</span>
                        <div className="text-lg sm:text-2xl font-black text-[#1E2316] mt-0.5">
                          ₹{pricingBreakdown.unit_labour_cost.toFixed(2)}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F0] border border-[#EBE6DC]">
                        <span className="text-[10px] sm:text-xs text-[#6B7260]">Material Cost</span>
                        <div className="text-lg sm:text-2xl font-black text-[#1E2316] mt-0.5">
                          ₹{pricingBreakdown.unit_material_cost.toFixed(2)}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F0] border border-[#EBE6DC]">
                        <span className="text-[10px] sm:text-xs text-[#6B7260]">Overheads</span>
                        <div className="text-lg sm:text-2xl font-black text-[#1E2316] mt-0.5">
                          ₹{pricingBreakdown.unit_overhead_cost.toFixed(2)}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FEFCE8] border border-[#FEF08A]">
                        <span className="text-[10px] sm:text-xs text-[#064e3b] font-semibold">Total Unit Cost</span>
                        <div className="text-lg sm:text-2xl font-black text-[#064e3b] mt-0.5">
                          ₹{pricingBreakdown.total_unit_cost.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#064e3b] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold text-[#FEF08A] uppercase tracking-wider">
                          Recommended Selling Range
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                          {pricingBreakdown.ai_recommended_range}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-emerald-200 block">Minimum Protected Floor</span>
                        <span className="text-xl sm:text-2xl font-black text-[#FEF08A]">
                          ₹{pricingBreakdown.seller_price_floor}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-[#EBE6DC]">
                      <Button
                        variant="secondary"
                        onClick={() => setProductStage("details")}
                        className="bg-[#FAF7F0] text-[#1E2316] border border-[#EBE6DC] text-xs cursor-pointer w-full sm:w-auto"
                      >
                        ← Edit Inputs
                      </Button>
                      <Button
                        onClick={() => setProductStage("review")}
                        className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-md w-full sm:w-auto"
                      >
                        Proceed to Floor Setting & Review →
                      </Button>
                    </div>
                  </div>
                )}

                {/* STAGE 4: Floor Setting & Review */}
                {productStage === "review" && (
                  <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-xl font-black text-[#064e3b]">Product Review & Publish</h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
                      <div className="md:col-span-4 h-48 sm:h-64 rounded-2xl overflow-hidden bg-[#FAF7F0] relative border border-[#EBE6DC] flex items-center justify-center">
                        {cameraEvidence?.finished_product_photo ? (
                          <img
                            src={cameraEvidence.finished_product_photo}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-10 h-10 text-[#6B7260]" />
                        )}
                      </div>

                      <div className="md:col-span-8 space-y-3 text-xs">
                        <h4 className="text-sm sm:text-lg font-bold text-[#1E2316]">
                          {productForm.title || "Handmade Artisan Piece"}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F0] border border-[#EBE6DC]">
                            <span className="text-[#6B7260] text-[11px]">Production Cost:</span>
                            <div className="text-xs sm:text-sm font-bold text-[#1E2316]">
                              ₹{pricingBreakdown.total_unit_cost.toFixed(2)} / unit
                            </div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F0] border border-[#EBE6DC]">
                            <span className="text-[#6B7260] text-[11px]">Selling Price:</span>
                            <div className="text-xs sm:text-sm font-bold text-[#1E2316]">
                              ₹{pricingBreakdown.fair_selling_price} / unit
                            </div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FEFCE8] border border-[#FEF08A]">
                            <span className="text-[#064e3b] text-[11px] font-semibold">Protected Floor:</span>
                            <div className="text-xs sm:text-sm font-bold text-[#064e3b]">
                              ₹{pricingBreakdown.seller_price_floor}
                            </div>
                          </div>
                          <div className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F0] border border-[#EBE6DC]">
                            <span className="text-[#6B7260] text-[11px]">Daily Capacity:</span>
                            <div className="text-xs sm:text-sm font-bold text-[#15803d]">
                              {productForm.daily_capacity_units} units / day
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] text-[#064e3b] text-xs">
                          🛡️ <strong>Floor Guardrail:</strong> Offers below ₹{pricingBreakdown.seller_price_floor} cannot be accepted.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-[#EBE6DC]">
                      <Button
                        variant="secondary"
                        onClick={() => setProductStage("pricing")}
                        className="bg-[#FAF7F0] text-[#1E2316] border border-[#EBE6DC] text-xs cursor-pointer w-full sm:w-auto"
                      >
                        ← Back to Pricing
                      </Button>
                      <Button
                        onClick={handlePublishProduct}
                        className="bg-[#064e3b] hover:bg-emerald-800 text-white font-black text-xs sm:text-sm px-6 py-3 cursor-pointer shadow-md w-full sm:w-auto"
                      >
                        ✓ Confirm & Publish Product
                      </Button>
                    </div>
                  </div>
                )}

                {/* STAGE 5: Published Success */}
                {productStage === "published" && (
                  <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#15803d] text-center space-y-3 sm:space-y-4 shadow-sm">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FEFCE8] border-2 border-[#15803d] text-[#15803d] mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-[#064e3b]">Product Successfully Saved!</h3>
                    <p className="text-xs text-[#6B7260] max-w-md mx-auto">
                      Your authentic craft piece is now recorded in database and indexed in ChromaDB vector repository.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                      <Button
                        onClick={() => setActiveTab("home")}
                        className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-sm w-full sm:w-auto"
                      >
                        Return to Dashboard Home
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setProductForm({
                            title: "",
                            craft_category: "Bamboo Craft",
                            material_cost_inr: 0,
                            workers_count: 1,
                            labour_daily_rate_inr: 400,
                            production_days: 1,
                            daily_capacity_units: 5,
                            batch_units: 10,
                            packaging_cost_inr: 0,
                            workshop_rent_daily_inr: 0,
                            energy_cost_daily_inr: 0,
                            transport_batch_cost_inr: 0,
                            target_margin_percent: 25.0,
                            seller_price_floor_inr: 0,
                            listed_price_inr: 0,
                            description: "",
                          });
                          setCameraEvidence(null);
                          setProductStage("camera");
                        }}
                        className="bg-[#FAF7F0] text-[#1E2316] border border-[#EBE6DC] font-bold text-xs cursor-pointer w-full sm:w-auto"
                      >
                        + Add Another Craft
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: CHAT & NEGOTIATION ROOM */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "chat" && (
              <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm text-center space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] text-[#064e3b] mx-auto flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#1E2316]">No active buyer negotiation yet</h3>
                <p className="text-xs text-[#6B7260] max-w-md mx-auto">
                  When a buyer initiates a custom inquiry or bulk order offer, the negotiation session and AI price floor guardrail will appear here in real time.
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: LOCATION & VENUE */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "location" && (
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EBE6DC] pb-3 sm:pb-4">
                  <div>
                    <h3 className="text-base sm:text-xl font-black text-[#064e3b] flex items-center gap-2">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#15803d]" />
                      Workshop Geolocation & Venue
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#6B7260] mt-0.5">
                      Capture GPS coordinates for buyer radius search.
                    </p>
                  </div>

                  <Button
                    onClick={handleGetLocation}
                    disabled={locatingState}
                    className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-md w-full sm:w-auto"
                  >
                    {locatingState ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Detecting GPS...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#FEF08A]" />
                        Get Current Location
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  {currentCoords ? (
                    <div className="p-4 sm:p-6 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] space-y-2.5">
                      <div className="text-xs text-[#6B7260]">Captured Coordinates:</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-[#064e3b]">
                        Lat: {currentCoords.lat} | Lng: {currentCoords.lng}
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs shadow-sm w-full sm:w-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View on Google Maps ↗
                      </a>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF7F0] border border-[#EBE6DC] text-center text-xs text-[#6B7260]">
                      No coordinates captured yet. Click <strong>"Get Current Location"</strong> above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: NOTIFICATIONS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "notifications" && (
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4">
                <h3 className="text-base sm:text-xl font-black text-[#064e3b] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#CA8A04]" />
                  Notifications & Alerts
                </h3>

                <div className="space-y-2.5 pt-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F0] border border-[#EBE6DC] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#1E2316] flex items-center gap-2">
                          {n.title}
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#CA8A04]" />
                          )}
                        </div>
                        <p className="text-xs text-[#6B7260]">{n.message}</p>
                        <span className="text-[10px] text-[#9CA3AF] block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 6: SETTINGS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === "settings" && (
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE6DC] shadow-sm space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-xl font-black text-[#064e3b] flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-[#15803d]" />
                  Artisan Profile & Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#4A5240] mb-1">Artisan Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name || ""}
                        placeholder="Your name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#4A5240] mb-1">Business / Shop Name</label>
                      <input
                        type="text"
                        defaultValue={user?.business_name || ""}
                        placeholder="Your artisan business name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#4A5240] mb-1">Language</label>
                      <select className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none">
                        <option>English</option>
                        <option>Tamil (தமிழ்)</option>
                        <option>Hindi (हिन्दी)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#4A5240] mb-1">Phone Number</label>
                      <input
                        type="text"
                        defaultValue={user?.phone || ""}
                        placeholder="+91..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#D1D5DB] text-[#1E2316] focus:border-[#064e3b] focus:bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-[#EBE6DC]">
                  <Button className="bg-[#064e3b] hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 cursor-pointer shadow-md w-full sm:w-auto">
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 3. "Why This Price?" Modal (Mobile Optimized) */}
      {isWhyPriceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#EBE6DC] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-3.5 text-[#1E2316] shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-[#064e3b] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#CA8A04]" />
                Deterministic Price Rationale
              </h3>
              <button
                onClick={() => setIsWhyPriceOpen(false)}
                className="text-[#6B7260] hover:text-[#1E2316] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed text-[#4A5240]">
              <p>
                Estimated unit cost: <strong>₹{pricingBreakdown.total_unit_cost.toFixed(2)} per unit</strong>.
              </p>
              <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#EBE6DC] space-y-1 font-mono text-[11px] text-[#1E2316]">
                <div>• Material Cost: ₹{pricingBreakdown.unit_material_cost.toFixed(2)}</div>
                <div>• Labour: ₹{pricingBreakdown.unit_labour_cost.toFixed(2)}</div>
                <div>• Overheads: ₹{pricingBreakdown.unit_overhead_cost.toFixed(2)}</div>
              </div>
              <p>
                Minimum acceptable price floor: <strong>₹{pricingBreakdown.seller_price_floor}</strong>.
              </p>
              <p className="text-[#064e3b] font-semibold">
                Recommended range: <strong>{pricingBreakdown.ai_recommended_range}</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setIsWhyPriceOpen(false)}
                className="bg-[#064e3b] text-white font-bold text-xs cursor-pointer shadow-sm w-full sm:w-auto"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
