import React from 'react';

/**
 * Autocomplete component to display grounded suggestions from the seller dataset.
 *
 * @param {Object} props
 * @param {Array} props.suggestions - List of product suggestions from API
 * @param {boolean} props.isLoading - Whether suggestions are fetching
 * @param {string} props.query - Current search string
 * @param {number} props.activeIndex - Current focused index via keyboard navigation
 * @param {Function} props.onSelect - Callback when a suggestion is clicked
 * @param {Function} props.onSearch - Callback to execute search on current query
 */
export default function Autocomplete({
  suggestions = [],
  isLoading = false,
  query = '',
  activeIndex = -1,
  onSelect,
  onSearch,
}) {
  if (!query.trim()) return null;

  // Category Emoji helper
  const getCategoryIcon = (category = '') => {
    const lower = category.toLowerCase();
    if (lower.includes('wood') || lower.includes('toy')) return '🪵';
    if (lower.includes('pot') || lower.includes('decor') || lower.includes('clay')) return '🏺';
    if (lower.includes('cloth') || lower.includes('silk') || lower.includes('sari')) return '🧵';
    if (lower.includes('bag') || lower.includes('jute')) return '👜';
    if (lower.includes('footwear') || lower.includes('mojari')) return '👞';
    if (lower.includes('brass') || lower.includes('metal')) return '✨';
    return '📦';
  };

  // Helper to highlight matching text
  const highlightMatch = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="font-semibold text-brand-600 underline decoration-brand-300">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      role="listbox"
      id="search-autocomplete-listbox"
    >
      {/* Header indicating seller dataset grounding */}
      <div className="px-4 py-2 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>Seller Catalog Suggestions</span>
        {isLoading && (
          <span className="flex items-center gap-1.5 text-brand-600">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Searching...
          </span>
        )}
      </div>

      {/* Suggestions List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {suggestions.length > 0 ? (
          suggestions.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={item.id || index}
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(item)}
                className={`dropdown-item flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-100 ${
                  isActive ? 'bg-orange-50/80' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0" aria-hidden="true">
                    {getCategoryIcon(item.category)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {highlightMatch(item.name, query)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.seller_name} • {item.seller_location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 ml-3 text-right">
                  <span className="text-sm font-semibold text-gray-900">₹{item.price}</span>
                  <span className="badge badge-orange text-[10px] hidden sm:inline-block">
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          !isLoading && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              <p className="font-medium text-gray-700">No instant product suggestions</p>
              <p className="text-xs text-gray-400 mt-1">
                Press Enter to run full natural-language & semantic search
              </p>
            </div>
          )
        )}
      </div>

      {/* Direct Search query option */}
      <div
        onClick={() => onSearch(query)}
        className="px-4 py-3 bg-gray-50 hover:bg-brand-50 border-t border-gray-100 flex items-center gap-2.5 text-xs text-brand-600 font-semibold cursor-pointer transition-colors"
      >
        <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search for &ldquo;<span className="text-gray-900">{query}</span>&rdquo;</span>
        <span className="ml-auto text-[11px] text-gray-400 font-normal">Press Enter ↵</span>
      </div>
    </div>
  );
}
