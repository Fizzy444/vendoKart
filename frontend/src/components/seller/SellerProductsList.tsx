"use client";

import React, { useState } from "react";
import { Product } from "@/types/product";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  IndianRupee,
  Layers,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

interface SellerProductsListProps {
  products: Product[];
  isLoading: boolean;
  onOpenAddModal: () => void;
  onProductDeleted: (productId: string) => void;
}

export function SellerProductsList({
  products,
  isLoading,
  onOpenAddModal,
  onProductDeleted,
}: SellerProductsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api.deleteProduct(id);
      onProductDeleted(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-artisan-400" />
            Your Listed Crafts & Catalogue ({products.length})
          </h2>
          <p className="text-xs text-slate-400">
            Handmade crafts published for customer discovery and bulk orders.
          </p>
        </div>

        <Button
          onClick={onOpenAddModal}
          size="sm"
          className="text-xs bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Object for Sale
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
          <div className="w-8 h-8 border-3 border-artisan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading your craft products...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 border-dashed space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-artisan-500/10 text-artisan-400 mx-auto flex items-center justify-center border border-artisan-500/20">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-100">
              No products listed yet
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your first handcrafted object with deterministic cost pricing to start receiving customer orders and bulk requests.
            </p>
          </div>
          <Button
            onClick={onOpenAddModal}
            className="bg-artisan-500 hover:bg-artisan-600 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add First Craft Object
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="p-0 bg-slate-900 border-slate-800 shadow-xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all"
            >
              {/* Product Image */}
              <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Package className="w-12 h-12" />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  <Badge variant="primary" size="sm">
                    {product.craft_category}
                  </Badge>
                  {product.is_customizable && (
                    <Badge variant="secondary" size="sm">
                      Bespoke
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700 text-xs font-bold text-emerald-400">
                  ₹{product.listed_price_inr}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-artisan-300 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Deterministic Math Specs Breakdown */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Base Production Cost:</span>
                    <strong className="text-slate-200">
                      ₹{product.pricing?.total_unit_cost_inr ?? product.material_cost_inr}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Fair Profit / Unit:</span>
                    <strong className="text-emerald-400">
                      +₹{product.pricing?.profit_per_unit_inr ?? Math.round(product.listed_price_inr * 0.25)} ({product.target_margin_percent}%)
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-400" /> Stock: {product.stock_quantity} units
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" /> Lead: {product.lead_time_days} days
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Published Listing
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(product.id, product.title)}
                    disabled={deletingId === product.id}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
