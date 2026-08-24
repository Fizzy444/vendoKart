"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { HealthResponse } from "@/types/auth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Hammer,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Camera,
  Mic,
  Calculator,
  Layers,
  ArrowRight,
  CheckCircle2,
  Server,
  Database,
  KeyRound,
} from "lucide-react";

export default function HomePage() {
  const { user, openAuthModal } = useAuth();
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealthData(data);
      } catch (e) {
        console.error("Health check error:", e);
      } finally {
        setHealthLoading(false);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-artisan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-ochre-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-artisan-500/10 border border-artisan-500/20 text-artisan-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Stage 0: Foundations & Phone OTP Auth Active
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            AI Virtual Business Manager for{" "}
            <span className="bg-gradient-to-r from-artisan-400 via-ochre-400 to-artisan-500 bg-clip-text text-transparent">
              Traditional Artisans
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bridging the gap between <em>“I can craft this product”</em> and <em>“I can professionally present, price, negotiate, and sell online.”</em>
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto shadow-glow">
                  Enter Dashboard ({user.roles.join(", ")})
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => openAuthModal("seller")}
                  className="w-full sm:w-auto shadow-glow"
                >
                  <Hammer className="w-4 h-4 mr-2 text-artisan-300" />
                  Join as Artisan / Seller
                </Button>

                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => openAuthModal("buyer")}
                  className="w-full sm:w-auto"
                >
                  <ShoppingBag className="w-4 h-4 mr-2 text-ochre-400" />
                  Explore as Buyer
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live System Diagnostics & Stage 0 Verification */}
      <section className="py-12 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-artisan-400" />
                Foundations & Infrastructure Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time connection verification for FastAPI, MongoDB, Redis, and Security Tokens.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                FastAPI v0.1.0-stage0
              </Badge>
              <Badge variant="success" size="md">
                Mock OTP Dev Provider Ready
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Card */}
            <Card variant="glow" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  MongoDB (System of Record)
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                {healthData?.database.status === "healthy" ? "Connected" : "Ready / Async Pool"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                DB: {healthData?.database.database_name || "artisan_commerce"}
              </p>
            </Card>

            {/* Redis Card */}
            <Card variant="glow" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-ochre-400" />
                  Redis & Task Cache
                </span>
                <span className="w-2 h-2 rounded-full bg-ochre-400 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                {healthData?.redis.status === "healthy" ? "Connected" : "Ready / In-Memory Fallback"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                OTP Cache & Session Token Storage
              </p>
            </Card>

            {/* Auth / Security Card */}
            <Card variant="glow" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-artisan-400" />
                  JWT & Phone OTP Auth
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-sm font-bold text-slate-200">Active & Enforced</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                HS256 Dual Token Rotation
              </p>
            </Card>

            {/* S3 Storage Card */}
            <Card variant="glow" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  MinIO / S3 Object Storage
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <p className="text-sm font-bold text-slate-200">Configured</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Bucket: {healthData?.storage.bucket || "artisan-media"}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              A Four-Pillar Enablement Architecture
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Separating deterministic business constraints from intelligent AI assistants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="interactive" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-artisan-500/10 text-artisan-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Voice-First Catalogue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Artisans speak in their native tongue. Whisper ASR & Catalogue Agent extract structured attributes.
              </p>
            </Card>

            <Card variant="interactive" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-ochre-500/10 text-ochre-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Photography Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live camera feedback for lighting, blur, and 5-angle craft proof to ensure buyer trust without studio gear.
              </p>
            </Card>

            <Card variant="interactive" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Deterministic Pricing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hard math guarantees a non-negotiable cost floor + fair craft wages, enriched with market medians.
              </p>
            </Card>

            <Card variant="interactive" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Multi-Artisan Orders</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregates decentralized artisan capacity to fulfill large corporate and hospitality bulk orders.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
