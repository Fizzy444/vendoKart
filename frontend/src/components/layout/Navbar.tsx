"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Hammer,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Activity,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, openAuthModal, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState<string>("checking");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-artisan-500 to-ochre-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-artisan-500/20 group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                vendoKart
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-artisan-500/20 text-artisan-400 border border-artisan-500/30">
                  AI Artisan
                </span>
              </span>
            </div>
          </Link>

          {/* System Health Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "healthy"
                  ? "bg-emerald-400 animate-pulse"
                  : healthStatus === "offline"
                  ? "bg-red-400"
                  : "bg-amber-400"
              }`}
            />
            <span className="capitalize text-[11px] font-mono">
              API {healthStatus}
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Dashboard
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors text-xs text-slate-400 hover:underline flex items-center gap-1"
          >
            API Docs ↗
          </a>
        </nav>

        {/* User Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-artisan-500/20 text-artisan-400 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.name || user.phone}
                  </p>
                  <div className="flex items-center gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="text-[10px] uppercase font-mono tracking-wider text-artisan-400"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Sign Out"
                className="text-slate-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuthModal("seller")}
                className="text-xs"
              >
                <Hammer className="w-3.5 h-3.5 mr-1 text-artisan-400" />
                Artisan Portal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAuthModal("buyer")}
                className="text-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                Sign In
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-slate-300 hover:text-white py-1"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-slate-300 hover:text-white py-1"
          >
            Dashboard
          </Link>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-slate-400 py-1"
          >
            API Swagger Docs ↗
          </a>
          <div className="pt-2 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{user.name || user.phone}</p>
                  <p className="text-xs text-artisan-400 capitalize">{user.roles.join(", ")}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("seller");
                  }}
                >
                  Artisan Login
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal("buyer");
                  }}
                >
                  Buyer Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
