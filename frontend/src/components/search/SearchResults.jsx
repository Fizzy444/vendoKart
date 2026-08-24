import React from 'react';
import { SearchUIState } from '../../types/search';
import ProductCard from './ProductCard';
import RequirementsCard from './RequirementsCard';
import NoResults from './NoResults';

/**
 * SearchResults container component managing results presentation across all UI states.
 *
 * @param {Object} props
 * @param {string} props.uiState - Current SearchUIState
 * @param {import('../../types/search').SearchResponseData} props.searchResult - Search data payload
 * @param {string} [props.errorMessage] - Error string if failed
 * @param {string} props.submittedQuery - The query that was searched
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onQuerySelect - Direct query trigger callback
 */
export default function SearchResults({
  uiState,
  searchResult,
  errorMessage,
  submittedQuery,
  onRetry,
  onQuerySelect,
}) {
  const { answer, products = [], extractedRequirements } = searchResult || {};

  // 1. Loading / Searching State
  if (uiState === SearchUIState.SEARCHING) {
    return (
      <div className="py-12 px-4 text-center max-w-xl mx-auto animate-in fade-in duration-200">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-brand-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            ✨
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Finding matching products...
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Querying the RAG semantic search engine and checking seller inventory & lead times...
        </p>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 text-left">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
              <div className="w-full h-44 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-16 bg-gray-50 rounded-xl mb-4" />
              <div className="h-8 bg-gray-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (uiState === SearchUIState.ERROR) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">
          Unable to search right now
        </h3>
        <p className="text-xs sm:text-sm text-red-700 mb-6">
          {errorMessage || 'There was a connection issue while reaching the search service. Please try again.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // 3. No Results State
  if (uiState === SearchUIState.NO_RESULTS || (uiState === SearchUIState.SUCCESS && products.length === 0)) {
    return <NoResults query={submittedQuery} onSuggestClick={onQuerySelect} />;
  }

  // 4. Success State with Products
  if (uiState === SearchUIState.SUCCESS && products.length > 0) {
    return (
      <div className="my-6">
        {/* Results Header & Query Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Search Results
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
              &ldquo;{submittedQuery}&rdquo;
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-green text-xs px-3 py-1 font-semibold">
              {products.length} {products.length === 1 ? 'product found' : 'products found'}
            </span>
          </div>
        </div>

        {/* Extracted Requirements Breakdown (if NL query had parameters) */}
        {extractedRequirements && (
          <RequirementsCard requirements={extractedRequirements} />
        )}

        {/* AI Grounded Summary (if generated and non-default) */}
        {answer && answer !== 'NOT_AVAILABLE' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-100 shadow-sm mb-6 flex items-start gap-3.5">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong className="font-semibold text-gray-900 block mb-0.5">AI Search Assistant:</strong>
              {answer}
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  // 5. Idle / Welcome State
  return (
    <div className="py-12 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-orange-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
        🏺
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        Explore Authentic Artisan Products
      </h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-8 max-w-md mx-auto">
        Search for handcrafted items by name or describe your custom bulk requirements in natural language.
      </p>

      {/* Suggested categories list */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-4">
          Popular Searches
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {[
            { label: '🪵 Wooden Toys', query: 'wooden toys under ₹500' },
            { label: '🏺 Terracotta Pots', query: 'I need 20 pots under ₹2000' },
            { label: '🧵 Silk Saris', query: 'silk sari' },
            { label: '👜 Jute Bags', query: 'handmade jute bag' },
            { label: '⚡ Fast Delivery (≤ 2 days)', query: 'gifts manufactured within 2 days' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onQuerySelect(item.query)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-gray-50 hover:bg-brand-50 hover:text-brand-600 border border-gray-200/80 hover:border-brand-200 transition-all text-gray-700"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
