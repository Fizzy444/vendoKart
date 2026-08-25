"use client";

import React from "react";
import {
  Home,
  Compass,
  Grid,
  FileText,
  ShoppingBag,
  MessageSquare,
  Heart,
  Bell,
  User,
  Settings,
  X,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onCloseMobile,
}) => {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-[#EBE6DC] flex flex-col h-full min-h-screen select-none">
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#B84018] text-white flex items-center justify-center font-bold text-xl shadow-md">
            vK
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[#1E2316] tracking-tight leading-none">
              vendo<span className="text-[#B84018]">Kart</span>
            </h1>
            <p className="text-[10px] text-[#6B7260] font-medium tracking-wide mt-0.5">
              Bridging Artisans with the World
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

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? "bg-[#44521E] text-white shadow-sm font-semibold"
                  : "text-[#4A5240] hover:bg-[#F2ECE1] hover:text-[#1E2316]"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-[#6B7260]"
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Heritage Empowerment Card */}
      <div className="p-4 m-4 rounded-3xl bg-[#F7F3EA] border border-[#E8E1D3] text-center space-y-3">
        <div className="w-8 h-8 rounded-full bg-[#44521E]/10 text-[#44521E] mx-auto flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1E2316]">
            Empowering Artisans
          </h4>
          <p className="text-[11px] text-[#6B7260] mt-0.5">
            Preserving Heritage Crafts
          </p>
        </div>
        <button
          onClick={() => alert("vendoKart connects 10,000+ verified Indian artisans directly with global buyers, ensuring transparent pricing and fair craft wages.")}
          className="w-full py-2 bg-[#EFEBE0] hover:bg-[#E4DDCF] text-[#44521E] font-semibold text-xs rounded-xl transition"
        >
          Know More
        </button>
      </div>
    </aside>
  );
};
