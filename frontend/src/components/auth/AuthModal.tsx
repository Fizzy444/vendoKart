"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Phone,
  Hammer,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalRole, login } = useAuth();

  const otpInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [role, setRole] = useState<"seller" | "buyer">(authModalRole || "seller");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial role when opening modal
  useEffect(() => {
    if (authModalRole) {
      setRole(authModalRole);
    }
  }, [authModalRole]);

  // Focus OTP on transition
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  if (!isAuthModalOpen) return null;

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
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
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
      await login(cleanPhone, otp, role, name || undefined);
      // Reset form state
      setStep("phone");
      setOtp("");
      setDevOtpHint(null);
    } catch (err: any) {
      setError(err.message || "Invalid OTP code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-artisan-500/10 text-artisan-400 mb-3 border border-artisan-500/20">
            {role === "seller" ? <Hammer className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            {step === "phone"
              ? role === "seller"
                ? "Artisan / Seller Portal"
                : "Buyer & Collector Sign In"
              : "Verify Security Code"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {step === "phone"
              ? "Sign in or register with your mobile number"
              : `Enter the 6-digit code sent via SMS to ${phone}`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Role Selector & Phone Entry */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRole("seller")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === "seller"
                    ? "bg-artisan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                Artisan / Seller
              </button>
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  role === "buyer"
                    ? "bg-artisan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Buyer / Customer
              </button>
            </div>

            {/* Name input (optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Name / Business Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all"
              />
            </div>

            {/* Phone input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobile Number (with country code)
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
                  placeholder="+91 00000 00000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700/60 text-sm focus:outline-none focus:border-artisan-500 focus:ring-1 focus:ring-artisan-500 transition-all font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full mt-2"
              size="lg"
            >
              Get Verification Code
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification with dynamic 6-box translucent '0' segmented display */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {/* Dev Mode Notification */}
            {devOtpHint && (
              <div className="p-3 bg-ochre-500/10 border border-ochre-500/20 rounded-xl text-xs text-ochre-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-ochre-400" />
                  Dev Mode Active:
                </span>
                <Badge variant="secondary" size="sm">
                  Mock OTP: {devOtpHint}
                </Badge>
              </div>
            )}

            {/* 6-Digit Segmented Box UI */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2.5 text-center">
                Enter 6-Digit Security Code
              </label>
              
              <div className="relative flex justify-center items-center">
                {/* Hidden input capture */}
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

                {/* 6 Box Display showing translucent '0' when empty and typed digit when filled */}
                <div className="grid grid-cols-6 gap-2 w-full max-w-xs">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const digit = otp[index];
                    const isCurrent = otp.length === index;
                    return (
                      <div
                        key={index}
                        onClick={() => otpInputRef.current?.focus()}
                        className={`h-13 py-3 rounded-xl border flex items-center justify-center text-xl font-mono font-bold transition-all select-none ${
                          digit
                            ? "bg-slate-900 border-artisan-500 text-white shadow-sm shadow-artisan-500/20"
                            : isCurrent
                            ? "bg-slate-950 border-artisan-500 text-slate-500/40 ring-2 ring-artisan-500/20"
                            : "bg-slate-950 border-slate-800 text-slate-700/40"
                        }`}
                      >
                        {digit ? (
                          <span className="text-white">{digit}</span>
                        ) : (
                          <span className="text-slate-600/40 opacity-40">0</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="hover:text-slate-200 transition-colors"
              >
                ← Change Number
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-artisan-400 hover:text-artisan-300 transition-colors"
              >
                Resend Code
              </button>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={otp.length < 6}
              className="w-full mt-2"
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Verify & Enter Platform
            </Button>
          </form>
        )}

        {/* Modal Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By continuing, you agree to our Terms of Digital Craft Commerce & Privacy Standards.
        </p>
      </div>
    </div>
  );
};
