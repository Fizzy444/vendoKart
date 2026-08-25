"use client";

import React, { useState } from "react";
import { Search, Sparkles, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  aiMode: boolean;
  setAiMode: (mode: boolean) => void;
  onSearch: (queryOverride?: string) => void;
  isSearching?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  aiMode,
  setAiMode,
  onSearch,
  isSearching,
}) => {
  const suggestedSearches = [
    "Handwoven Sarees",
    "Brass Lamps",
    "Wall Hangings",
    "Bamboo Baskets",
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    onSearch(tag);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#EBE6DC] space-y-4">
      <label className="block text-xs font-semibold text-[#6B7260] tracking-wide">
        What are you looking for today?
      </label>

      {/* Main Search Input Group */}
      <div className="relative flex items-center bg-[#FDFCF9] border border-[#E0DACB] rounded-2xl p-2 focus-within:border-[#44521E] focus-within:ring-2 focus-within:ring-[#44521E]/10 transition-all">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products or requirements..."
          className="w-full bg-transparent px-4 py-2 text-sm text-[#1E2316] placeholder-[#9AA08F] focus:outline-none"
        />

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              onSearch("");
            }}
            className="p-1.5 text-[#9AA08F] hover:text-[#1E2316] rounded-full transition mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* AI Mode Toggle Pill */}
        <button
          type="button"
          onClick={() => setAiMode(!aiMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 mr-2 shrink-0 ${
            aiMode
              ? "bg-[#FAF5EB] text-[#44521E] border border-[#D9CEB5]"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
          title="Toggle Natural Language AI Requirement Extraction"
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              aiMode ? "text-[#B84018] animate-pulse" : "text-gray-400"
            }`}
          />
          <span>AI Mode</span>
        </button>

        {/* Terracotta Circular Search Button */}
        <button
          type="button"
          onClick={() => onSearch()}
          disabled={isSearching}
          className="w-12 h-12 rounded-full bg-[#B84018] hover:bg-[#A03410] text-white flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0 disabled:opacity-50"
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Suggested Search Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[#6B7260] font-medium mr-1">Try:</span>
        {suggestedSearches.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="px-3.5 py-1.5 rounded-full bg-[#F5F1E6] hover:bg-[#EAE4D4] text-[#4A5240] font-medium transition"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};
