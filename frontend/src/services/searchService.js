/**
 * @file searchService.js
 * Client service layer for interacting with the vendoKart Search & Autocomplete API.
 * Grounded in the seller dataset without generating fictional products.
 */

const API_BASE_URL = '/api';

/**
 * Fetch autocomplete suggestions matching the seller dataset.
 * 
 * @param {string} query - The search query fragment
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<Array<import('../types/search').Product>>}
 */
export async function fetchAutocompleteSuggestions(query, signal) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return [];
  }

  const url = `${API_BASE_URL}/autocomplete?q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Autocomplete request failed with status: ${response.status}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'Failed to retrieve autocomplete suggestions');
  }

  return json.suggestions || [];
}

/**
 * Perform semantic & natural-language search with constraints via the RAG API.
 * 
 * @param {string} query - The full search query or natural language description
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<import('../types/search').SearchResponseData>}
 */
export async function searchProductsRAG(query, signal) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return {
      answer: 'Please enter a search query.',
      products: [],
      extractedRequirements: {
        product: null,
        max_budget: null,
        quantity: null,
        max_manufacturing_days: null,
      },
    };
  }

  const url = `${API_BASE_URL}/search`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: trimmed }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status: ${response.status}`);
  }

  const json = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Search query failed');
  }

  return json.data;
}
