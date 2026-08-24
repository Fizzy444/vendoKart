"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Hammer,
  ShoppingBag,
  Phone,
  User as UserIcon,
  Store,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Languages,
  TrendingUp,
  Heart,
  Palette,
  Check,
} from "lucide-react";

interface AuthCardProps {
  initialMode?: "login" | "register";
  initialRole?: "seller" | "buyer";
  redirectUrl?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode = "login",
  initialRole = "seller",
  redirectUrl = "/dashboard",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const otpInputRef = useRef<HTMLInputElement>(null);

  const queryRole = searchParams.get("role") as "seller" | "buyer" | null;
  const queryMode = searchParams.get("mode") as "login" | "register" | null;

  const [mode, setMode] = useState<"login" | "register">(queryMode || initialMode);
  const [role, setRole] = useState<"seller" | "buyer">(queryRole || initialRole);
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form Fields (Clean empty defaults with zero placeholders)
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [craftCategory, setCraftCategory] = useState<string>("Handloom & Textiles");
  const [buyerInterest, setBuyerInterest] = useState<string>("Home Decor & Crafts");
  const [otp, setOtp] = useState<string>("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Sync if query params change
  useEffect(() => {
    if (queryRole && (queryRole === "seller" || queryRole === "buyer")) {
      setRole(queryRole);
    }
  }, [queryRole]);

  useEffect(() => {
    if (queryMode && (queryMode === "login" || queryMode === "register")) {
      setMode(queryMode);
    }
  }, [queryMode]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus OTP input on transition
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      if (cleanPhone.length < 10) {
        throw new Error("Please enter your complete mobile number with country code");
      }

      const response = await api.sendOtp(cleanPhone);
      if (response.is_dev_mode && response.dev_otp) {
        setDevOtpHint(response.dev_otp);
      }
      setResendCooldown(30);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send SMS verification code. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\s+/g, "");
      const finalName = role === "seller" 
        ? (name || businessName || undefined) 
        : (name || undefined);

      await login(cleanPhone, otp, role, finalName);
      
      // Navigate to destination
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const craftCategories = [
    "Handloom & Textiles",
    "Pottery & Terracotta",
    "Woodcraft & Carvings",
    "Brass & Metal Art",
    "Handmade Jewelry",
    "Traditional Paintings",
    "Leather & Jute Crafts",
    "Organic & Natural Foods",
  ];

  const buyerInterests = [
    "Home Decor & Crafts",
    "Ethnic Apparel & Shawls",
    "Artisan Jewelry",
    "Traditional Folk Art",
    "Eco-friendly Kitchenware",
    "Artisan Gifts & Collectibles",
  ];

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Left Feature Column: Dynamic role-based showcase */}
      <div
        className={`lg:col-span-5 rounded-3xl p-8 border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
          role === "seller"
            ? "bg-gradient-to-br from-artisan-950 via-slate-900 to-slate-950 border-artisan-500/30 text-slate-100"
            : "bg-gradient-to-br from-slate-900 via-slate-950 to-ochre-950/30 border-ochre-500/30 text-slate-100"
        }`}
      >
        {/* Background glow orb */}
        <div
          className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
            role === "seller" ? "bg-artisan-500" : "bg-ochre-400"
          }`}
        />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-semibold mb-6">
            {role === "seller" ? (
              <>
                <Hammer className="w-3.5 h-3.5 text-artisan-400" />
                <span className="text-artisan-400">Artisan & Seller Portal</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-ochre-400" />
                <span className="text-ochre-400">Buyer & Collector Experience</span>
              </>
            )}
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4">
            {role === "seller" ? (
              <>
                Empower your craft with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-artisan-400 to-ochre-400">
                  AI-Powered Commerce
                </span>
              </>
            ) : (
              <>
                Discover authentic crafts directly from{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ochre-400 to-amber-300">
                  Master Artisans
                </span>
              </>
            )}
          </h2>

          <p className="text-sm text-slate-300/90 leading-relaxed mb-8">
            {role === "seller"
              ? "Sell globally without tech barriers. Voice cataloging in your regional dialect, automated fair pricing, and smart order fulfillment."
              : "Direct fair-trade access to verified Indian artisans. Trace origin stories, customize bespoke crafts, and preserve cultural heritage."}
          </p>

          {/* Value props list */}
          <div className="space-y-4">
            {role === "seller" ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-artisan-500/10 border border-artisan-500/20 flex items-center justify-center text-artisan-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Voice & Photo AI Catalog</h4>
                    <p className="text-xs text-slate-400">
                      Snap a photo or speak in your language to generate professional listings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-artisan-500/10 border border-artisan-500/20 flex items-center justify-center text-artisan-400 shrink-0 mt-0.5">
                    <Languages className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Multilingual Translation</h4>
                    <p className="text-xs text-slate-400">
                      Auto-translate your stories to Hindi, English, Tamil, Bengali & more.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-artisan-500/10 border border-artisan-500/20 flex items-center justify-center text-artisan-400 shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Fair Pricing Advisor</h4>
                    <p className="text-xs text-slate-400">
                      Calculates raw material + artisan labour hours to guarantee profitable margins.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-ochre-500/10 border border-ochre-500/20 flex items-center justify-center text-ochre-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">100% Certified Authentic</h4>
                    <p className="text-xs text-slate-400">
                      Every item is verified directly from authentic regional clusters and weavers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-ochre-500/10 border border-ochre-500/20 flex items-center justify-center text-ochre-400 shrink-0 mt-0.5">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Direct Artisan Support</h4>
                    <p className="text-xs text-slate-400">
                      Zero exploitative middlemen. Up to 85% of each sale goes straight to makers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-ochre-500/10 border border-ochre-500/20 flex items-center justify-center text-ochre-400 shrink-0 mt-0.5">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Bespoke Customization</h4>
                    <p className="text-xs text-slate-400">
                      Request custom sizing, personalized colors, and artisan signatures.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer trust strip */}
        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Twilio Verified SMS Security
          </span>
          <span>Fast Passwordless Login</span>
        </div>
      </div>

      {/* Right Column: Interactive Sign In / Sign Up Card */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Header & Role Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                {step === "otp"
                  ? "Verify Security Code"
                  : mode === "login"
                  ? "Welcome Back"
                  : "Create Your Account"}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === "otp"
                  ? `Enter the 6-digit code sent via SMS to ${phone}`
                  : mode === "login"
                  ? "Sign in with your registered mobile number"
                  : `Join vendoKart as ${role === "seller" ? "an Artisan Seller" : "a Buyer"}`}
              </p>
            </div>

            {/* Mode Toggle (Sign In vs Sign Up) */}
            {step === "form" && (
              <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === "login"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === "register"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Role Tabs */}
          {step === "form" && (
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Select Your Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole("seller");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                    role === "seller"
                      ? "bg-artisan-600/10 border-artisan-500 text-artisan-400 shadow-sm shadow-artisan-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <div className="text-left">
                    <div className="leading-tight">Artisan / Seller</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Makers & Producers
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("buyer");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                    role === "buyer"
                      ? "bg-ochre-600/10 border-ochre-500 text-ochre-400 shadow-sm shadow-ochre-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <div className="text-left">
                    <div className="leading-tight">Buyer / Customer</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Craft Lovers & Shoppers
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* STEP 1: Phone & Profile Information */}
          {step === "form" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name field (Recommended for Register, Optional for Login) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {mode === "register" ? "Your Full Name" : "Your Name (Optional)"}
                  {mode === "register" && <span className="text-artisan-400 ml-1">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required={mode === "register"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all"
                  />
                </div>
              </div>

              {/* Extra Registration Fields */}
              {mode === "register" && role === "seller" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Business / Studio Name (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Store className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Primary Craft Specialty
                    </label>
                    <select
                      value={craftCategory}
                      onChange={(e) => setCraftCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all"
                    >
                      {craftCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {mode === "register" && role === "buyer" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    What crafts are you most excited to explore?
                  </label>
                  <select
                    value={buyerInterest}
                    onChange={(e) => setBuyerInterest(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500 transition-all"
                  >
                    {buyerInterests.map((interest) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone number field */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mobile Number (with country code) <span className="text-artisan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We will send a 6-digit verification code to your phone via SMS.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                variant={role === "seller" ? "primary" : "primary"}
                className={`w-full mt-4 py-3 ${
                  role === "buyer" ? "bg-ochre-600 hover:bg-ochre-500 focus:ring-ochre-500" : ""
                }`}
                size="lg"
              >
                <span>
                  {mode === "login" ? "Get Verification Code" : "Register & Continue"}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          {/* STEP 2: OTP Verification with dynamic 6-box '-' segmented display */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* Dev Mode Notification Badge */}
              {devOtpHint && (
                <div className="p-3.5 bg-ochre-500/10 border border-ochre-500/20 rounded-2xl text-xs text-ochre-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-4 h-4 text-ochre-400" />
                    Dev Sandbox Mock OTP:
                  </span>
                  <Badge variant="secondary" size="sm" className="font-mono font-bold tracking-wider">
                    {devOtpHint}
                  </Badge>
                </div>
              )}

              {/* SMS Notification Banner */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-artisan-400" />
                  SMS Sent to:
                </span>
                <span className="font-mono text-slate-200 font-semibold">{phone}</span>
              </div>

              {/* 6-Digit Segmented Pin Display with - placeholders */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-3 text-center">
                  Enter 6-Digit Security Code
                </label>

                <div className="relative flex justify-center items-center">
                  {/* Invisible capture input */}
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {/* 6 Segmented Boxes showing '-' when empty and typed digit when filled */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-sm">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = otp[index];
                      const isCurrent = otp.length === index;
                      return (
                        <div
                          key={index}
                          onClick={() => otpInputRef.current?.focus()}
                          className={`h-14 sm:h-16 rounded-2xl border flex items-center justify-center text-xl sm:text-2xl font-mono font-bold transition-all select-none ${
                            digit
                              ? "bg-slate-900 border-artisan-500 text-white shadow-sm shadow-artisan-500/20"
                              : isCurrent
                              ? "bg-slate-950 border-artisan-500 text-slate-400 ring-2 ring-artisan-500/20"
                              : "bg-slate-950 border-slate-800 text-slate-600"
                          }`}
                        >
                          {digit ? digit : "-"}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Navigation and Resend */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Details
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleSendOtp}
                  className="text-artisan-400 hover:text-artisan-300 disabled:text-slate-600 transition-colors font-medium"
                >
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={otp.length < 6}
                className={`w-full py-3 ${
                  role === "buyer" ? "bg-ochre-600 hover:bg-ochre-500 focus:ring-ochre-500" : ""
                }`}
                size="lg"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm & Enter Platform
              </Button>
            </form>
          )}
        </div>

        {/* Footer switch prompt */}
        <div className="pt-6 mt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {mode === "login" ? (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setStep("form");
                  setError(null);
                }}
                className="text-artisan-400 hover:text-artisan-300 font-semibold underline underline-offset-2 ml-1"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered with us?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep("form");
                  setError(null);
                }}
                className="text-artisan-400 hover:text-artisan-300 font-semibold underline underline-offset-2 ml-1"
              >
                Sign in directly
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
