"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import {
  Hammer,
  ShieldCheck,
  Bell,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenSettings,
}) => {
  const { user, openAuthModal, devLogin, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("healthy");
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.getHealth();
        setHealthStatus(health.status);
      } catch {
        setHealthStatus("offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-800 bg-[#064e3b] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Sidebar Toggle & Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-white transition-all cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-100" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-white text-[#064e3b] flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              <Hammer className="w-4 h-4 text-[#064e3b]" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                vendoKart
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FEF08A] text-[#064e3b] shadow-sm">
                  AI Artisan
                </span>
              </div>
              <span className="text-[10px] text-emerald-200 font-medium tracking-wide hidden sm:block">
                Handmade Artisan Digital Commerce
              </span>
            </div>
          </Link>

          {/* System Health Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-700 text-emerald-100">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "healthy"
                  ? "bg-emerald-400 animate-pulse"
                  : healthStatus === "offline"
                  ? "bg-red-400"
                  : "bg-amber-400"
              }`}
            />
            <span className="capitalize text-[11px] font-medium">
              API {healthStatus}
            </span>
          </div>
        </div>

        {/* Right Side: Notification Icon & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell Shortcut */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-emerald-100 transition-all cursor-pointer"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FEF08A] text-[#064e3b] text-[10px] font-black flex items-center justify-center shadow-sm">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown in Corner */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-left transition-all cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-[#064e3b] font-black flex items-center justify-center text-sm shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
                    {user.business_name || user.name || "Artisan Shop"}
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FEF08A] inline" />
                  </div>
                  <span className="text-[10px] text-emerald-200 block leading-tight font-mono">
                    {user.phone || "+91..."}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#EBE6DC] shadow-xl p-2 z-50 text-[#1E2316]">
                  <div className="px-3 py-2.5 border-b border-[#EBE6DC] mb-1 bg-[#FEFCE8] rounded-xl">
                    <p className="text-xs font-bold text-[#064e3b]">
                      {user.name || "Artisan"}
                    </p>
                    <p className="text-[11px] text-[#6B7260]">
                      {user.business_name || "Verified Artisan Guild"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onOpenSettings) onOpenSettings();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#FAF7F0] text-[#1E2316] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#6B7260]" />
                    Business Profile
                  </button>

                  <div className="my-1 border-t border-[#EBE6DC]" />

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => openAuthModal("seller")}
                className="bg-[#FEF08A] hover:bg-yellow-300 text-[#064e3b] font-black text-xs shadow-md border border-yellow-300 cursor-pointer"
              >
                Login / Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
