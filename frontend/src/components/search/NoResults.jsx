import React from 'react';

/**
 * Component for Grounded "Product Not Available" state.
 * Emphasizes strict grounding: never hallucinates or substitutes unrelated items.
 *
 * @param {Object} props
 * @param {string} props.query - The search query that returned no matches
 * @param {Function} [props.onSuggestClick] - Quick retry callback with suggested categories
 */
export default function NoResults({ query, onSuggestClick }) {
  const suggestedSearches = [
    'Wooden Toys',
    'Terracotta Clay Pot',
    'Handwoven Silk Sari',
    'Handmade Jute Bag',
    'Ceramic Flower Vase',
  ];

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm border border-gray-100 my-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Icon */}
      <div className="w-20 h-20 bg-orange-50 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner border border-orange-100">
        🔍
      </div>

      {/* Main Title */}
      <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">
        Product Not Available
      </h3>

      {/* Query Specific Note */}
      {query ? (
        <p className="text-sm sm:text-base text-gray-600 mb-2 max-w-md mx-auto">
          &ldquo;<span className="font-semibold text-gray-900">{query}</span>&rdquo; is currently not available from our verified artisan sellers.
        </p>
      ) : (
        <p className="text-sm sm:text-base text-gray-600 mb-2 max-w-md mx-auto">
          We couldn&apos;t find a matching product from our sellers.
        </p>
      )}

      <p className="text-xs text-gray-400 mb-6">
        Try adjusting your budget, quantity, or searching for a different handcrafted category.
      </p>

      {/* Grounding guarantee callout */}
      <div className="bg-amber-50/60 rounded-xl p-3.5 mb-8 border border-amber-200/60 text-left flex items-start gap-3">
        <span className="text-base flex-shrink-0">🛡️</span>
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">RAG Grounding Guarantee:</strong> Our AI search only returns verified products present in the active seller catalog and will never recommend unrelated substitute items.
        </div>
      </div>

      {/* Suggested available categories */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-3">
          Explore Available Artisan Categories
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestedSearches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSuggestClick && onSuggestClick(item)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 hover:bg-brand-100 text-gray-700 hover:text-brand-800 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
