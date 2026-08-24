import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ArrowLeft, Sparkles, Hammer } from "lucide-react";

export const metadata: Metadata = {
  title: "Artisan & Seller Portal — vendoKart",
  description: "AI-powered digital commerce portal for artisans, handloom weavers, and craft producers.",
};

export default function SellerAuthPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-artisan-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Breadcrumb */}
      <div className="max-w-5xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
        <span className="text-xs text-artisan-400 font-mono flex items-center gap-1 bg-artisan-500/10 px-3 py-1 rounded-full border border-artisan-500/20">
          <Hammer className="w-3.5 h-3.5" />
          Artisan Creator Access
        </span>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-5xl mx-auto h-96 flex items-center justify-center text-slate-400 text-sm">
            <Sparkles className="w-5 h-5 animate-spin text-artisan-400 mr-2" />
            Loading Artisan Portal...
          </div>
        }
      >
        <AuthCard initialMode="login" initialRole="seller" />
      </Suspense>
    </div>
  );
}
