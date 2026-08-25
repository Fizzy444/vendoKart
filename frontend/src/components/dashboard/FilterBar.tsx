"use client";

import React from "react";
import { Filter, MapPin, ChevronDown, RotateCcw } from "lucide-react";

interface FilterBarProps {
  priceRange: string;
  setPriceRange: (val: string) => void;
  quantityRange: string;
  setQuantityRange: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  locationMode: string;
  setLocationMode: (val: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  userLocation?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  priceRange,
  setPriceRange,
  quantityRange,
  setQuantityRange,
  category,
  setCategory,
  locationMode,
  setLocationMode,
  onApplyFilters,
  onClearFilters,
  hasActiveFilters,
  userLocation,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#EBE6DC]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        {/* Price Range Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7260] uppercase tracking-wider mb-1.5">
            Price Range
          </label>
          <div className="relative">
            <select
              value={priceRange}
              onChange={(e) => {
                setPriceRange(e.target.value);
                onApplyFilters();
              }}
              className="w-full appearance-none bg-[#FDFCF9] border border-[#E0DACB] text-[#1E2316] text-xs font-semibold rounded-2xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-[#44521E] cursor-pointer"
            >
              <option value="">Any Price</option>
              <option value="under_500">Under ₹500</option>
              <option value="500_1000">₹500 – ₹1,000</option>
              <option value="1000_3000">₹1,000 – ₹3,000</option>
              <option value="3000_5000">₹3,000 – ₹5,000</option>
              <option value="above_5000">Above ₹5,000</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7260] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quantity Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7260] uppercase tracking-wider mb-1.5">
            Quantity
          </label>
          <div className="relative">
            <select
              value={quantityRange}
              onChange={(e) => {
                setQuantityRange(e.target.value);
                onApplyFilters();
              }}
              className="w-full appearance-none bg-[#FDFCF9] border border-[#E0DACB] text-[#1E2316] text-xs font-semibold rounded-2xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-[#44521E] cursor-pointer"
            >
              <option value="">Any Quantity</option>
              <option value="1_10">1 – 10</option>
              <option value="10_50">10 – 50</option>
              <option value="50_100">50 – 100</option>
              <option value="100_500">100 – 500</option>
              <option value="500_plus">500+</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7260] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7260] uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                onApplyFilters();
              }}
              className="w-full appearance-none bg-[#FDFCF9] border border-[#E0DACB] text-[#1E2316] text-xs font-semibold rounded-2xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-[#44521E] cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Pottery">Pottery</option>
              <option value="Handloom">Handloom</option>
              <option value="Textiles">Textiles</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Bamboo">Bamboo</option>
              <option value="Woodcraft">Woodcraft</option>
              <option value="Home Décor">Home Décor</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7260] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Location Dropdown ("Nearby Me") */}
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7260] uppercase tracking-wider mb-1.5">
            Location
          </label>
          <div className="relative">
            <select
              value={locationMode}
              onChange={(e) => {
                setLocationMode(e.target.value);
                onApplyFilters();
              }}
              className="w-full appearance-none bg-[#FDFCF9] border border-[#E0DACB] text-[#1E2316] text-xs font-semibold rounded-2xl pl-8 pr-8 py-2.5 focus:outline-none focus:border-[#44521E] cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="nearby">
                Nearby Me {userLocation ? `(${userLocation})` : ""}
              </option>
            </select>
            <MapPin className="w-3.5 h-3.5 text-[#B84018] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-4 h-4 text-[#6B7260] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Deep Olive Filters / Clear Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onApplyFilters}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#44521E] hover:bg-[#364217] text-white font-semibold text-xs rounded-2xl shadow-sm transition active:scale-95"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="p-2.5 bg-[#F5F1E6] hover:bg-[#EAE4D4] text-[#4A5240] rounded-2xl transition"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
