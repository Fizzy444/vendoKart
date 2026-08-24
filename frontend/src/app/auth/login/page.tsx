import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — vendoKart Artisan & Buyer Access",
  description: "Sign in to your vendoKart account for Artisans, Sellers, and Buyers via secure phone OTP.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-artisan-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-ochre-500/10 rounded-full blur-[96px] pointer-events-none" />

      {/* Top Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Auth Card with Suspense for query param handling */}
      <Suspense
        fallback={
          <div className="w-full max-w-5xl mx-auto h-96 flex items-center justify-center text-slate-400 text-sm">
            <Sparkles className="w-5 h-5 animate-spin text-artisan-400 mr-2" />
            Loading authentication portal...
          </div>
        }
      >
        <AuthCard initialMode="login" />
      </Suspense>
    </div>
  );
}
