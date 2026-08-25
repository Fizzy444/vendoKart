"use client";

import React from "react";
import { MapPin, User as UserIcon } from "lucide-react";

interface HeaderGreetingProps {
  userName?: string;
  userLocation?: string;
  onOpenProfile: () => void;
}

export const HeaderGreeting: React.FC<HeaderGreetingProps> = ({
  userName,
  userLocation,
  onOpenProfile,
}) => {
  const displayName = userName && userName.trim() ? userName.trim() : "User";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2316] tracking-tight flex items-center gap-2">
          Hello {displayName} <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-sm text-[#6B7260] mt-1">
          Find authentic handmade products from trusted artisans across India.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EBE6DC] shadow-sm hover:bg-[#F7F4EE] transition text-xs font-medium text-[#44521E]"
        >
          <MapPin className="w-3.5 h-3.5 text-[#B84018]" />
          <span>{userLocation || "Set Location"}</span>
        </button>
        <button
          onClick={onOpenProfile}
          className="p-2 rounded-full bg-white border border-[#EBE6DC] shadow-sm hover:bg-[#F7F4EE] transition text-[#44521E]"
          title="Profile Settings"
        >
          <UserIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
