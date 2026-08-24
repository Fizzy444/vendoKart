import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, HeartHandshake } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-artisan-600 flex items-center justify-center text-white font-bold text-sm">
                V
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                vendoKart • Artisan Commerce
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              An AI-powered digital commerce enablement platform for traditional artisans and small
              producers. Bridging craftsmanship to global market readiness.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider mb-3">
              Platform Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li>Stage 0: Foundations & Auth (Active)</li>
              <li className="text-slate-500">Stage 1: Seller Core & Pricing Engine</li>
              <li className="text-slate-500">Stage 2: Buyer Core & Discovery</li>
              <li className="text-slate-500">Stage 3: Voice AI & Catalogue Agent</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider mb-3">
              Developer Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-artisan-400 transition-colors"
                >
                  FastAPI OpenAPI Docs ↗
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/v1/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-artisan-400 transition-colors"
                >
                  Health Check Endpoint ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} vendoKart. Built for traditional artisans and micro-producers.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Pricing Guardrails
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
