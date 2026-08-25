/**
 * @file chat.js
 * Type definitions and constants for the Inbuilt Buyer-to-Seller Chat Box.
 */

export const MessageType = {
  TEXT: 'TEXT',
  PRODUCT: 'PRODUCT',
  QUOTE: 'QUOTE',
  SYSTEM: 'SYSTEM',
};

export const MessageSender = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
};

export const QuoteStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  NEGOTIATING: 'negotiating',
};

/**
 * @typedef {Object} QuoteData
 * @property {string} id
 * @property {string} productName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} totalPrice
 * @property {number} productionDays
 * @property {string} status - 'pending' | 'accepted' | 'negotiating'
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} sender - 'BUYER' | 'SELLER'
 * @property {string} type - 'TEXT' | 'PRODUCT' | 'QUOTE' | 'SYSTEM'
 * @property {string} text
 * @property {string} timestamp
 * @property {import('./search').Product} [productContext]
 * @property {QuoteData} [quoteData]
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} sellerName
 * @property {string} sellerLocation
 * @property {boolean} isVerified
 * @property {boolean} isOnline
 * @property {import('./search').Product} [product]
 * @property {ChatMessage[]} messages
 * @property {number} unreadCount
 */
