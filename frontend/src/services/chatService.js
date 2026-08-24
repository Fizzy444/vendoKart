/**
 * @file chatService.js
 * Service layer for managing Buyer-to-Seller conversations.
 * Structured to connect to real chat/messaging backend, with grounded mock responses for UI simulation.
 */

import { MessageType, MessageSender, QuoteStatus } from '../types/chat';

/**
 * Format current time as HH:MM AM/PM
 */
export function getCurrentTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Creates a unique message ID
 */
export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Initialize a chat session for a given seller and product
 *
 * @param {import('../types/search').Product} product
 * @returns {import('../types/chat').ChatMessage[]}
 */
export function getInitialGreeting(product) {
  const sellerName = product?.seller_name || 'Artisan Seller';
  const productName = product?.name || 'this item';
  
  return [
    {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.TEXT,
      text: `Namaste! I am from ${sellerName}. How can I assist you with "${productName}" today?`,
      timestamp: getCurrentTimestamp(),
    },
  ];
}

/**
 * Simulates grounded seller response based on the buyer's query and product context.
 * In a production backend, this would be an API call `POST /api/chat/messages` or WebSocket emit.
 *
 * @param {string} buyerText
 * @param {import('../types/search').Product} product
 * @returns {Promise<import('../types/chat').ChatMessage>}
 */
export async function simulateSellerResponse(buyerText, product) {
  // Artificial delay for realistic typing feel (750ms - 1500ms)
  await new Promise((resolve) => setTimeout(resolve, 900));

  const text = (buyerText || '').toLowerCase();
  const productName = product?.name || 'this handcrafted item';
  const unitPrice = product?.price || 500;
  const mfgDays = product?.manufacturing_days || 2;
  const stock = product?.stock || 50;

  // 1. Check for Quote or Bulk quantity request
  const qtyMatch = text.match(/(\d+)\s*(pieces?|pcs?|units?|items?|pots?|toys?|saris?|bags?)/i) || text.match(/quote|price for (\d+)|make (\d+)/i);
  let requestedQty = 20; // default bulk
  if (qtyMatch) {
    const num = parseInt(qtyMatch[1] || qtyMatch[2] || '20', 10);
    if (!isNaN(num) && num > 0) {
      requestedQty = num;
    }
  }

  if (text.includes('quote') || text.includes('how much for') || text.includes('bulk') || qtyMatch) {
    const totalPrice = unitPrice * requestedQty;
    const productionTime = requestedQty > stock ? mfgDays + 2 : mfgDays;

    return {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.QUOTE,
      text: `Here is a custom quotation for ${requestedQty} units of ${productName}:`,
      timestamp: getCurrentTimestamp(),
      quoteData: {
        id: `quote_${Date.now()}`,
        productName: productName,
        quantity: requestedQty,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        productionDays: productionTime,
        status: QuoteStatus.PENDING,
      },
    };
  }

  // 2. Customization inquiry
  if (text.includes('custom') || text.includes('color') || text.includes('design') || text.includes('pattern') || text.includes('size')) {
    return {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.TEXT,
      text: `Yes, we can customize "${productName}" according to your specific color, size, and packaging requirements. We use traditional artisan methods. Please share your custom details!`,
      timestamp: getCurrentTimestamp(),
    };
  }

  // 3. Delivery / Manufacturing time inquiry
  if (text.includes('days') || text.includes('delivery') || text.includes('time') || text.includes('when') || text.includes('fast') || text.includes('urgent')) {
    return {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.TEXT,
      text: `For standard orders, our production lead time is ${mfgDays} ${mfgDays === 1 ? 'day' : 'days'}. We currently have ${stock} units in stock and can dispatch immediately.`,
      timestamp: getCurrentTimestamp(),
    };
  }

  // 4. Price / Discount / Negotiation inquiry
  if (text.includes('discount') || text.includes('cheaper') || text.includes('less') || text.includes('negotiate') || text.includes('best price')) {
    return {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.TEXT,
      text: `Our listed unit price is ₹${unitPrice.toLocaleString('en-IN')}. For bulk orders of 20+ units, we can offer competitive wholesale artisan rates. Would you like a quote?`,
      timestamp: getCurrentTimestamp(),
    };
  }

  // 5. Default polite response
  return {
    id: generateMessageId(),
    sender: MessageSender.SELLER,
    type: MessageType.TEXT,
    text: `Thank you for your interest in our handcrafted ${productName}. Let me know if you need specific quantities, custom carvings, or an official quotation!`,
    timestamp: getCurrentTimestamp(),
  };
}
