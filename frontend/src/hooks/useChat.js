import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageType, MessageSender, QuoteStatus } from '../types/chat';
import {
  generateMessageId,
  getCurrentTimestamp,
  getInitialGreeting,
  simulateSellerResponse,
} from '../services/chatService';

/**
 * Custom React hook for managing the Inbuilt Buyer-to-Seller Chat Box.
 */
export function useChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSellerTyping, setIsSellerTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Store conversation histories keyed by seller/product ID
  const conversationsRef = useRef({});

  // Reset unread count when opening or unminimizing
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  /**
   * Open chat with a specific seller and product context
   */
  const openChatWithProduct = useCallback((product) => {
    if (!product) return;

    setCurrentProduct(product);
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);

    const convKey = `${product.seller_name || 'seller'}_${product.id}`;
    if (conversationsRef.current[convKey]) {
      setMessages(conversationsRef.current[convKey]);
    } else {
      const initial = getInitialGreeting(product);
      conversationsRef.current[convKey] = initial;
      setMessages(initial);
    }
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
    if (isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  /**
   * Send a message as BUYER and simulate SELLER response
   */
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || !currentProduct) return;

      const buyerMsg = {
        id: generateMessageId(),
        sender: MessageSender.BUYER,
        type: MessageType.TEXT,
        text: trimmed,
        timestamp: getCurrentTimestamp(),
      };

      const convKey = `${currentProduct.seller_name || 'seller'}_${currentProduct.id}`;

      // Append buyer message
      setMessages((prev) => {
        const updated = [...prev, buyerMsg];
        conversationsRef.current[convKey] = updated;
        return updated;
      });

      // Show typing indicator
      setIsSellerTyping(true);

      try {
        const sellerMsg = await simulateSellerResponse(trimmed, currentProduct);
        
        setIsSellerTyping(false);
        setMessages((prev) => {
          const updated = [...prev, sellerMsg];
          conversationsRef.current[convKey] = updated;
          return updated;
        });

        // Increment unread count if minimized
        setIsMinimized((min) => {
          if (min) {
            setUnreadCount((c) => c + 1);
          }
          return min;
        });
      } catch (err) {
        console.error('Failed to get seller response:', err);
        setIsSellerTyping(false);
      }
    },
    [currentProduct]
  );

  /**
   * Trigger predefined quick action prompts
   */
  const sendQuickAction = useCallback(
    (actionType) => {
      if (!currentProduct) return;

      switch (actionType) {
        case 'CUSTOMIZATION':
          sendMessage('Can you customize this product with different colors, materials, or custom engravings?');
          break;
        case 'QUOTE':
          sendMessage(`I would like to request an official quote for 20 units of "${currentProduct.name}".`);
          break;
        case 'DELIVERY':
          sendMessage('What is the earliest manufacturing and delivery date if I order today?');
          break;
        case 'SEND_PRODUCT':
          const productMsg = {
            id: generateMessageId(),
            sender: MessageSender.BUYER,
            type: MessageType.PRODUCT,
            text: `Inquiring about: ${currentProduct.name} (₹${currentProduct.price})`,
            productContext: currentProduct,
            timestamp: getCurrentTimestamp(),
          };
          const convKey = `${currentProduct.seller_name || 'seller'}_${currentProduct.id}`;
          setMessages((prev) => {
            const updated = [...prev, productMsg];
            conversationsRef.current[convKey] = updated;
            return updated;
          });
          break;
        default:
          break;
      }
    },
    [currentProduct, sendMessage]
  );

  /**
   * Handle Buyer accepting a Seller Quote
   */
  const handleAcceptQuote = useCallback((quoteId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.quoteData && msg.quoteData.id === quoteId) {
          return {
            ...msg,
            quoteData: {
              ...msg.quoteData,
              status: QuoteStatus.ACCEPTED,
            },
          };
        }
        return msg;
      })
    );

    // System confirmation
    const systemMsg = {
      id: generateMessageId(),
      sender: MessageSender.SELLER,
      type: MessageType.TEXT,
      text: '🎉 Great! You have accepted the quotation. Our artisan team will prepare your order for manufacturing and dispatch.',
      timestamp: getCurrentTimestamp(),
    };

    setMessages((prev) => [...prev, systemMsg]);
  }, []);

  /**
   * Handle Buyer asking to negotiate a Seller Quote
   */
  const handleNegotiateQuote = useCallback(
    (quoteId) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.quoteData && msg.quoteData.id === quoteId) {
            return {
              ...msg,
              quoteData: {
                ...msg.quoteData,
                status: QuoteStatus.NEGOTIATING,
              },
            };
          }
          return msg;
        })
      );

      sendMessage('Could you provide a small volume discount or expedited delivery for this quote?');
    },
    [sendMessage]
  );

  return {
    isOpen,
    isMinimized,
    currentProduct,
    messages,
    isSellerTyping,
    unreadCount,
    openChatWithProduct,
    closeChat,
    toggleMinimize,
    sendMessage,
    sendQuickAction,
    handleAcceptQuote,
    handleNegotiateQuote,
  };
}
