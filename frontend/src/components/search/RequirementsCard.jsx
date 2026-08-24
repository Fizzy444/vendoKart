import React from 'react';

/**
 * Component to display natural language extracted constraints.
 * 
 * @param {Object} props
 * @param {import('../../types/search').ExtractedRequirements} props.requirements
 */
export default function RequirementsCard({ requirements }) {
  if (!requirements) return null;

  const { product, max_budget, quantity, max_manufacturing_days } = requirements;

  // Only render if at least one meaningful constraint exists
  const hasConstraints = product || max_budget !== null || quantity !== null || max_manufacturing_days !== null;
  if (!hasConstraints) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs">
          ✨
        </span>
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-orange-900">
          Extracted Search Requirements
        </h3>
        <span className="ml-auto text-[11px] text-orange-600 font-medium bg-orange-100/80 px-2 py-0.5 rounded-md">
          AI Interpreted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {product && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100 shadow-2xs">
            <span className="text-[11px] font-medium text-gray-500 block">Product</span>
            <span className="text-sm font-bold text-gray-900 capitalize truncate block mt-0.5">
              📦 {product}
            </span>
          </div>
        )}

        {quantity !== null && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100 shadow-2xs">
            <span className="text-[11px] font-medium text-gray-500 block">Quantity</span>
            <span className="text-sm font-bold text-gray-900 block mt-0.5">
              🔢 {quantity} units
            </span>
          </div>
        )}

        {max_budget !== null && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100 shadow-2xs">
            <span className="text-[11px] font-medium text-gray-500 block">Budget</span>
            <span className="text-sm font-bold text-gray-900 block mt-0.5">
              💰 ≤ ₹{max_budget.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {max_manufacturing_days !== null && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100 shadow-2xs">
            <span className="text-[11px] font-medium text-gray-500 block">Manufacturing Time</span>
            <span className="text-sm font-bold text-gray-900 block mt-0.5">
              ⏳ ≤ {max_manufacturing_days} {max_manufacturing_days === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
