import React, { useRef, useEffect } from 'react';
import Autocomplete from './Autocomplete';

/**
 * SearchBox Component combining input field, autocomplete dropdown, and quick prompt chips.
 *
 * @param {Object} props
 * @param {string} props.query - Current search query value
 * @param {Function} props.onQueryChange - Setter for query
 * @param {Function} props.onSearch - Submit handler
 * @param {Function} props.onClear - Clear search handler
 * @param {Array} props.suggestions - Autocomplete suggestion items
 * @param {boolean} props.isSuggestionsLoading - Suggestions fetch status
 * @param {boolean} props.showDropdown - Dropdown open/closed status
 * @param {Function} props.setShowDropdown - Dropdown visibility setter
 * @param {number} props.activeSuggestionIndex - Current active index in dropdown
 * @param {Function} props.onSelectSuggestion - Select suggestion callback
 * @param {Function} props.onKeyDown - Keydown event handler
 */
export default function SearchBox({
  query,
  onQueryChange,
  onSearch,
  onClear,
  suggestions,
  isSuggestionsLoading,
  showDropdown,
  setShowDropdown,
  activeSuggestionIndex,
  onSelectSuggestion,
  onKeyDown,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowDropdown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const samplePrompts = [
    { label: '🪵 Wooden Toys', query: 'wooden toys under ₹500' },
    { label: '🏺 20 Pots under ₹2000', query: 'I need 20 pots under ₹2000 manufactured within 2 days' },
    { label: '🧵 Pure Silk Sari', query: 'Handwoven Silk Sari' },
    { label: '🚫 Negative Test (Pool)', query: 'I need a swimming pool for the toys' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto" ref={containerRef}>
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative" role="search">
        <div className="relative flex items-center">
          {/* Leading Search Icon */}
          <div className="absolute left-4 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => {
              if (query.trim() && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={onKeyDown}
            placeholder="Search products, gifts, or ask: 'I need 20 pots under ₹2000'..."
            className="search-input"
            aria-autocomplete="list"
            aria-controls="search-autocomplete-listbox"
            aria-expanded={showDropdown}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Right Action Icons (Clear + Submit) */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear search input"
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              aria-label="Submit search"
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Search</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <Autocomplete
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            query={query}
            activeIndex={activeSuggestionIndex}
            onSelect={onSelectSuggestion}
            onSearch={onSearch}
          />
        )}
      </form>

      {/* Quick Example Query Chips */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Try asking:</span>
        {samplePrompts.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onQueryChange(item.query);
              onSearch(item.query);
            }}
            className="px-2.5 py-1 rounded-lg bg-gray-100/80 hover:bg-brand-100 hover:text-brand-700 text-gray-600 transition-colors border border-gray-200/50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
