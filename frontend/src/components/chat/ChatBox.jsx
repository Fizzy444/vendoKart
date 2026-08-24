import React from 'react';
import ChatHeader from './ChatHeader';
import ProductContext from './ProductContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

/**
 * Main floating Inbuilt Buyer-to-Seller Chat Box widget.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {boolean} props.isMinimized
 * @param {import('../../types/search').Product} props.product
 * @param {import('../../types/chat').ChatMessage[]} props.messages
 * @param {boolean} props.isTyping
 * @param {number} props.unreadCount
 * @param {Function} props.onClose
 * @param {Function} props.onToggleMinimize
 * @param {Function} props.onSendMessage
 * @param {Function} props.onQuickAction
 * @param {Function} props.onAcceptQuote
 * @param {Function} props.onNegotiateQuote
 */
export default function ChatBox({
  isOpen,
  isMinimized,
  product,
  messages,
  isTyping,
  unreadCount = 0,
  onClose,
  onToggleMinimize,
  onSendMessage,
  onQuickAction,
  onAcceptQuote,
  onNegotiateQuote,
}) {
  if (!isOpen) return null;

  const sellerName = product?.seller_name || 'Artisan Seller';
  const sellerLocation = product?.seller_location || 'India';

  // 1. Minimized floating pill state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <button
          type="button"
          onClick={onToggleMinimize}
          className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-orange-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-brand-500/25 hover:scale-105 active:scale-95 transition-all duration-150 border-2 border-white/40"
        >
          <div className="relative">
            <span className="text-xl">💬</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-left pr-1">
            <div className="text-xs font-bold truncate max-w-[140px] leading-tight">
              {sellerName}
            </div>
            <div className="text-[10px] text-orange-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span>Chat active</span>
            </div>
          </div>
        </button>
      </div>
    );
  }

  // 2. Full Chat Dialog Window
  return (
    <div
      className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:w-[400px] h-[92vh] sm:h-[580px] max-h-[620px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-label={`Chat with ${sellerName}`}
    >
      {/* Header */}
      <ChatHeader
        sellerName={sellerName}
        sellerLocation={sellerLocation}
        isOnline={true}
        isVerified={true}
        onMinimize={onToggleMinimize}
        onClose={onClose}
      />

      {/* Pinned Product Context */}
      <ProductContext product={product} />

      {/* Message Stream */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        sellerName={sellerName}
        onAcceptQuote={onAcceptQuote}
        onNegotiateQuote={onNegotiateQuote}
      />

      {/* Input controls */}
      <MessageInput
        onSendMessage={onSendMessage}
        onQuickAction={onQuickAction}
      />
    </div>
  );
}
