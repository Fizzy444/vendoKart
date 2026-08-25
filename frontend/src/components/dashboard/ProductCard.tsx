"use client";

import React from "react";
import { ProductItem } from "@/types/search";
import { Heart, MapPin, CheckCircle2 } from "lucide-react";

interface ProductCardProps {
  product: ProductItem;
  onFavoriteToggle: (productId: string) => void;
  onViewDetails: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onFavoriteToggle,
  onViewDetails,
}) => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-[#EBE6DC] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full group">
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F7F4EE]">
        {/* Image */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Verified Artisan Badge */}
        {product.is_verified_artisan && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#44521E] text-white text-[10px] font-semibold shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-[#A8E063]" />
            <span>Verified Artisan</span>
          </div>
        )}

        {/* Heart Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(product.id);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition active:scale-90 ${
            product.is_favorite ? "text-[#B84018]" : "text-gray-400 hover:text-gray-600"
          }`}
          title={product.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart className={`w-4 h-4 ${product.is_favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          {/* Product Name */}
          <h3 className="font-extrabold text-base text-[#1E2316] line-clamp-1 group-hover:text-[#44521E] transition">
            {product.name}
          </h3>

          {/* Artisan Name */}
          <p className="text-xs text-[#6B7260] font-medium">
            by {product.artisan_name}
          </p>

          {/* Location */}
          <p className="text-xs text-[#6B7260] flex items-center gap-1 pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#B84018] shrink-0" />
            <span className="truncate">{product.location}</span>
          </p>

          {/* Minimum Order */}
          <p className="text-[11px] text-[#4A5240] font-medium pt-1">
            Min. Order: {product.min_order_qty} pieces / per day
          </p>
        </div>

        {/* Pricing Info */}
        <div className="space-y-3 pt-2 border-t border-[#F2ECE1]">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-[#1E2316]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.price_per_unit && (
              <span className="text-xs text-[#6B7260] font-medium">
                (₹{product.price_per_unit}/piece)
              </span>
            )}
          </div>

          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(product)}
            className="w-full py-2.5 px-4 bg-[#EFEBE0] hover:bg-[#E4DDCF] text-[#44521E] font-bold text-xs rounded-2xl transition active:scale-98"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
