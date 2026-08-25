"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types/auth";
import { api } from "@/services/api";
import { User as UserIcon, Phone, Mail, MapPin, Save, X, Sparkles } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSaved: (updatedUser: User) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaved,
}) => {
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [locationStr, setLocationStr] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setEmail(currentUser.email || "");
      const loc = currentUser.location?.city
        ? `${currentUser.location.city}, ${currentUser.location.state || ""}`
        : currentUser.location?.address || "";
      setLocationStr(loc);
    } else {
      // Check local storage fallback for guest location
      const savedLoc = localStorage.getItem("vendokart_saved_location");
      if (savedLoc) setLocationStr(savedLoc);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone Number is required.");
      return;
    }
    if (!locationStr.trim()) {
      setError("Location (City / State) is required.");
      return;
    }

    setIsLoading(true);

    try {
      // Extract city and state from location string e.g. "Kumbakonam, Tamil Nadu"
      const parts = locationStr.split(",").map((p) => p.trim());
      const city = parts[0] || locationStr;
      const state = parts[1] || "";

      // Save to localStorage for client persistence
      localStorage.setItem("vendokart_saved_location", locationStr.trim());
      if (name.trim()) {
        localStorage.setItem("vendokart_saved_name", name.trim());
      }

      let updatedUser: User;
      if (currentUser) {
        updatedUser = await api.updateProfile({
          name: name.trim(),
          email: email.trim() || undefined,
          location: {
            city,
            state,
            address: locationStr.trim(),
          },
        });
      } else {
        // Guest mode state fallback
        updatedUser = {
          id: "guest-user",
          phone: phone.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          roles: ["buyer"],
          status: "active",
          is_phone_verified: true,
          location: { city, state, address: locationStr.trim() },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      onSaved(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EBE6DC] relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#44521E]/10 text-[#44521E] flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#1E2316]">
                Buyer Profile & Location
              </h3>
              <p className="text-xs text-[#6B7260]">
                Set location to enable Nearby Me search filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Full Name <span className="text-[#B84018]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meera Nair"
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Phone Number <span className="text-[#B84018]">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Email ID (Optional) */}
          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Email ID <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Location (City, State) <span className="text-[#B84018]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                placeholder="Enter City, State"
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <MapPin className="w-4 h-4 text-[#B84018] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-[#6B7260] mt-1">
              This location will be saved and automatically consumed when filtering by "Nearby Me".
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#EFEBE0] hover:bg-[#E4DDCF] text-[#44521E] font-semibold text-xs rounded-2xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#44521E] hover:bg-[#364217] text-white font-bold text-xs rounded-2xl shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "Saving..." : "Save Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
