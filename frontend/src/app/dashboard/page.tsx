"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Hammer,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Phone,
  Calendar,
  Lock,
  Sparkles,
  Edit3,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading, openAuthModal, logout, refreshUser } = useAuth();
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [businessInput, setBusinessInput] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Protected route test results
  const [testResult, setTestResult] = useState<{
    endpoint: string;
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (user) {
      setNameInput(user.name || "");
      setBusinessInput(user.business_name || "");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-artisan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading authenticated session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Authentication Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            You must be logged in with a verified Phone OTP to access the artisan dashboard and protected API routes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => openAuthModal("seller")}>
              <Hammer className="w-4 h-4 mr-1.5" />
              Artisan Sign In
            </Button>
            <Button variant="secondary" onClick={() => openAuthModal("buyer")}>
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Buyer Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      await api.updateProfile({
        name: nameInput,
        business_name: businessInput,
      });
      await refreshUser();
      setEditingProfile(false);
    } catch (e: any) {
      alert("Failed to update profile: " + e.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const testEndpoint = async (type: "seller" | "buyer" | "me") => {
    setTestLoading(true);
    setTestResult(null);
    try {
      let res;
      if (type === "seller") {
        res = await api.testSellerRoute();
      } else if (type === "buyer") {
        res = await api.testBuyerRoute();
      } else {
        res = await api.getMe();
      }
      setTestResult({
        endpoint: `/api/v1/auth/${type === "me" ? "me" : type + "-only"}`,
        status: "success",
        message: JSON.stringify(res, null, 2),
      });
    } catch (err: any) {
      setTestResult({
        endpoint: `/api/v1/auth/${type === "me" ? "me" : type + "-only"}`,
        status: "error",
        message: err.message || "Request rejected with 403 Forbidden or 401 Unauthorized",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const isSeller = user.roles.includes("seller") || user.roles.includes("admin");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {user.business_name || user.name || "Artisan Dashboard"}
            </h1>
            <Badge variant="primary" size="md">
              <CheckCircle2 className="w-3 h-3 text-artisan-400 mr-1" />
              OTP Verified
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" /> {user.phone} • Registered:{" "}
            {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingProfile(!editingProfile)}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            {editingProfile ? "Cancel" : "Edit Profile"}
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-400">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editingProfile && (
        <Card className="my-6 border-artisan-500/30 bg-slate-900/90">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-artisan-400" />
            Update Profile Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Your Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Madhavan Nair"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-artisan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Business / Workshop Name</label>
              <input
                type="text"
                value={businessInput}
                onChange={(e) => setBusinessInput(e.target.value)}
                placeholder="e.g. Kerala Teak Handcrafts"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-artisan-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleSaveProfile} isLoading={saveLoading}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* User Details & Stage 0 Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Profile Card */}
        <Card variant="glow" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Account Identity
            </h3>
            <div className="w-8 h-8 rounded-lg bg-artisan-500/10 text-artisan-400 flex items-center justify-center">
              {isSeller ? <Hammer className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">User ID:</span>
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-200 font-medium font-mono">{user.phone}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Roles:</span>
              <div className="flex gap-1">
                {user.roles.map((r) => (
                  <Badge key={r} variant="primary" size="sm">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Account Status:</span>
              <Badge variant="success" size="sm">
                {user.status}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Live RBAC Guardrail Tester */}
        <Card variant="glow" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Stage 0 Protected Route Verification
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hit backend endpoints with current JWT Bearer token to test role-based access control.
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testEndpoint("me")}
              disabled={testLoading}
            >
              Test GET /api/v1/auth/me
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => testEndpoint("seller")}
              disabled={testLoading}
            >
              <Hammer className="w-3.5 h-3.5 mr-1 text-artisan-400" />
              Test /seller-only (Guarded)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => testEndpoint("buyer")}
              disabled={testLoading}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1 text-ochre-400" />
              Test /buyer-only (Guarded)
            </Button>
          </div>

          {/* Test Output Console */}
          {testResult && (
            <div
              className={`p-4 rounded-xl font-mono text-xs border ${
                testResult.status === "success"
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/30 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-bold">
                <span>{testResult.endpoint}</span>
                <span>{testResult.status.toUpperCase()}</span>
              </div>
              <pre className="whitespace-pre-wrap overflow-x-auto text-[11px]">
                {testResult.message}
              </pre>
            </div>
          )}
        </Card>
      </div>

      {/* Next Stages Roadmap Card */}
      <div className="mt-8">
        <Card className="bg-slate-900/60 border-slate-800 p-6">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-artisan-400" />
            Upcoming Architectural Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="font-bold text-artisan-400 block mb-1">Stage 1: Seller Core</span>
              <p className="text-slate-400">
                Product creation, manual attributes, and the pure math Deterministic Pricing Engine (§11).
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="font-bold text-ochre-400 block mb-1">Stage 2: Buyer Core</span>
              <p className="text-slate-400">
                Product browse, category filters, single-seller order placement, and status tracking.
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="font-bold text-blue-400 block mb-1">Stage 3: AI Voice & Catalogue</span>
              <p className="text-slate-400">
                Whisper speech-to-text, multilingual attribute extraction, and editable catalogue agent.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
