/**
 * @file search.js
 * Type definitions and constants for Buyer Search & RAG UI module.
 */

/**
 * UI State enum for search interaction lifecycle.
 */
export const SearchUIState = {
  IDLE: 'IDLE',
  TYPING: 'TYPING',
  LOADING_SUGGESTIONS: 'LOADING_SUGGESTIONS',
  SEARCHING: 'SEARCHING',
  SUCCESS: 'SUCCESS',
  NO_RESULTS: 'NO_RESULTS',
  ERROR: 'ERROR',
};

/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier
 * @property {string} name - Product display name
 * @property {string} category - Product category
 * @property {string} description - Detailed artisan description
 * @property {number} price - Unit price in INR (₹)
 * @property {number} stock - Available inventory count
 * @property {number} manufacturing_days - Lead time in days
 * @property {string} seller_name - Artisan or seller business name
 * @property {string} seller_location - State / Region
 * @property {string} image_url - Product image source URL
 * @property {number} [similarityScore] - Internal relevance score from search ranking
 */

/**
 * @typedef {Object} ExtractedRequirements
 * @property {string|null} product - Target item / category keyword extracted by AI
 * @property {number|null} max_budget - Budget limit in INR (₹)
 * @property {number|null} quantity - Requested quantity
 * @property {number|null} max_manufacturing_days - Maximum allowable production days
 */

/**
 * @typedef {Object} SearchResponseData
 * @property {string} answer - RAG generated explanation or summary
 * @property {Product[]} products - List of matching seller products
 * @property {ExtractedRequirements} extractedRequirements - AI parsed query constraints
 */

/**
 * @typedef {Object} SearchApiResponse
 * @property {boolean} success - Operation status
 * @property {SearchResponseData} [data] - Search payload
 * @property {string} [message] - Error message if failed
 */

/**
 * @typedef {Object} AutocompleteApiResponse
 * @property {boolean} success - Operation status
 * @property {Product[]} suggestions - Array of matching products from seller catalog
 * @property {string} [message] - Error message if failed
 */
