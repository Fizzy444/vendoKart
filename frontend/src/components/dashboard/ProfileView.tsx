"use client";

import React, { useState } from "react";
import { User } from "@/types/auth";
import { api } from "@/services/api";
import { User as UserIcon, Phone, Mail, MapPin, Edit3, Save, CheckCircle2 } from "lucide-react";

interface ProfileViewProps {
  currentUser: User | null;
  onSaved: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onSaved,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(currentUser?.name || "");
  const [phone, setPhone] = useState<string>(currentUser?.phone || "");
  const [email, setEmail] = useState<string>(currentUser?.email || "");
  const [locationStr, setLocationStr] = useState<string>(
    currentUser?.location?.city
      ? `${currentUser.location.city}, ${currentUser.location.state || ""}`
      : currentUser?.location?.address || localStorage.getItem("vendokart_saved_location") || ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const parts = locationStr.split(",").map((p) => p.trim());
      const city = parts[0] || locationStr;
      const state = parts[1] || "";

      localStorage.setItem("vendokart_saved_location", locationStr.trim());
      if (name.trim()) {
        localStorage.setItem("vendokart_saved_name", name.trim());
      }

      let updatedUser: User;
      if (currentUser && currentUser.id !== "guest-user") {
        updatedUser = await api.updateProfile({
          name: name.trim(),
          email: email.trim() || undefined,
          location: { city, state, address: locationStr.trim() },
        });
      } else {
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
      setIsEditing(false);
      setMessage("Profile details updated successfully!");
    } catch (err: any) {
      setMessage(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EBE6DC] max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-4">
        <div>
          <h2 className="text-2xl font-black text-[#1E2316]">My Profile</h2>
          <p className="text-xs text-[#6B7260]">
            Manage and edit your personal details, contact information, and saved delivery location.
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EFEBE0] hover:bg-[#E4DDCF] text-[#44521E] font-bold text-xs rounded-2xl transition"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-[#FAF6EE] border border-[#EAE3D2] text-[#44521E] rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B84018]" />
          <span>{message}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A5240] mb-1">
              Saved Location (City, State)
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-10 bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl text-sm text-[#1E2316] focus:outline-none focus:border-[#44521E]"
                required
              />
              <MapPin className="w-4 h-4 text-[#B84018] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#44521E] hover:bg-[#364217] text-white font-bold text-xs rounded-2xl shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#6B7260] font-medium flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#44521E]" /> Full Name:
              </span>
              <span className="font-bold text-[#1E2316] text-sm">
                {currentUser?.name || "User"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#6B7260] font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#44521E]" /> Phone Number:
              </span>
              <span className="font-bold text-[#1E2316]">
                {currentUser?.phone || "Not provided"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#EBE6DC] pb-2.5">
              <span className="text-[#6B7260] font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#44521E]" /> Email ID:
              </span>
              <span className="font-bold text-[#1E2316]">
                {currentUser?.email || "Not provided"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6B7260] font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B84018]" /> Saved Location:
              </span>
              <span className="font-bold text-[#1E2316]">
                {locationStr}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
