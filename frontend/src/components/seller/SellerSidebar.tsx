"use client";

import React from "react";
import {
  Home,
  PlusCircle,
  MessageSquare,
  MapPin,
  Bell,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

interface SellerSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  unreadNotificationsCount?: number;
  onCloseMobile?: () => void;
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadNotificationsCount = 0,
  onCloseMobile,
}) => {
  const navItems = [
    { id: "home", label: "Home / Dashboard", icon: Home, badge: null },
    { id: "add-product", label: "Add My Product", icon: PlusCircle, badge: "Studio" },
    { id: "chat", label: "Chat & Negotiations", icon: MessageSquare, badge: null },
    { id: "location", label: "Location & Venue", icon: MapPin, badge: null },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount}` : null,
    },
    { id: "settings", label: "Settings", icon: SettingsIcon, badge: null },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-white text-[#1E2316] border-r border-[#EBE6DC] flex flex-col h-full min-h-screen select-none shadow-sm">
      {/* Sidebar Brand Header */}
      <div className="p-6 border-b border-[#EBE6DC] flex items-center justify-between bg-[#FEFCE8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#064e3b] text-white flex items-center justify-center font-black text-xl shadow-md">
            vK
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-[#064e3b] tracking-tight leading-none">
              vendo<span className="text-[#CA8A04]">Kart</span>
            </h1>
            <p className="text-[10px] text-[#4A5240] font-medium tracking-wide mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#CA8A04]" />
              Artisan Business Suite
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-[#6B7260] hover:text-[#1E2316] p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto bg-white">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7260] px-3 py-1 mb-1">
          Menu Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#064e3b] text-white shadow-md font-extrabold"
                  : "text-[#4A5240] hover:bg-[#FEFCE8] hover:text-[#064e3b]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? "text-[#FEF08A]"
                      : item.id === "add-product"
                      ? "text-[#064e3b]"
                      : "text-[#6B7260]"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive
                      ? "bg-[#FEF08A] text-[#064e3b]"
                      : "bg-[#FEFCE8] text-[#064e3b] border border-[#FEF08A]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Heritage Empowerment Card */}
      <div className="p-4 m-4 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] space-y-2.5 text-xs text-[#1E2316]">
        <div className="flex items-center gap-2 text-[#064e3b] font-bold">
          <ShieldCheck className="w-4 h-4 text-[#15803d]" />
          <span>Artisan Trust Protection</span>
        </div>
        <div className="text-[11px] text-[#4A5240] leading-relaxed">
          • Verified Workshop Evidence
          <br />
          • Protected Price Floor Guardrail
          <br />
          • Direct Buyer Fulfillment
        </div>
      </div>
    </aside>
  );
};
