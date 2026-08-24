import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ArrowLeft, Sparkles, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Buyer & Collector Sign In — vendoKart",
  description: "Direct craft discovery and purchasing portal for conscious buyers and collectors.",
};

export default function BuyerAuthPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-ochre-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Breadcrumb */}
      <div className="max-w-5xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
        <span className="text-xs text-ochre-400 font-mono flex items-center gap-1 bg-ochre-500/10 px-3 py-1 rounded-full border border-ochre-500/20">
          <ShoppingBag className="w-3.5 h-3.5" />
          Buyer & Collector Access
        </span>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-5xl mx-auto h-96 flex items-center justify-center text-slate-400 text-sm">
            <Sparkles className="w-5 h-5 animate-spin text-ochre-400 mr-2" />
            Loading Buyer Experience...
          </div>
        }
      >
        <AuthCard initialMode="login" initialRole="buyer" />
      </Suspense>
    </div>
  );
}
