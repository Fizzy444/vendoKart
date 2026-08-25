"use client";

import React from "react";
import { ProductItem } from "@/types/search";
import {
  X,
  MapPin,
  CheckCircle2,
  Package,
  Star,
  MessageSquare,
} from "lucide-react";

interface ProductDetailsModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#EBE6DC] relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-black shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Header Image */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#F7F4EE]">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_verified_artisan && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full bg-[#44521E] text-white text-xs font-semibold shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A8E063]" />
                <span>Verified Artisan Master</span>
              </div>
            )}
          </div>

          {/* Title & Artisan Header */}
          <div className="space-y-2 border-b border-[#F2ECE1] pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1E2316]">
                  {product.name}
                </h2>
                <p className="text-sm font-medium text-[#6B7260]">
                  by <span className="text-[#44521E] font-semibold">{product.artisan_name}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F7F3EA] text-xs font-bold text-[#B84018]">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{product.rating}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7260] pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#B84018]" />
                {product.location}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#44521E]" />
                Craft Type: {product.craft_type}
              </span>
            </div>
          </div>

          {/* Craft Story & Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7260]">
              Artisan Craft Story & Details
            </h4>
            <p className="text-sm text-[#3E4534] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Specifications Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8F5EE] rounded-2xl border border-[#E8E2D5] text-xs">
            <div>
              <span className="text-[#6B7260] block font-medium">Total Price</span>
              <span className="font-extrabold text-[#1E2316] text-base">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[#6B7260] block font-medium">Unit Price</span>
              <span className="font-bold text-[#44521E]">
                {product.price_per_unit ? `₹${product.price_per_unit} / piece` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#6B7260] block font-medium">Min. Order</span>
              <span className="font-bold text-[#1E2316]">
                {product.min_order_qty} pieces / per day
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => alert(`Bulk quote request sent to ${product.artisan_name} for ${product.min_order_qty} units of ${product.name}.`)}
              className="flex-1 py-3 px-4 bg-[#B84018] hover:bg-[#A03410] text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Contact Artisan for Bulk Order
            </button>
            <button
              onClick={onClose}
              className="py-3 px-6 bg-[#EFEBE0] hover:bg-[#E4DDCF] text-[#44521E] font-semibold text-sm rounded-2xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
