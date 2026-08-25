import React, { useRef, useEffect } from 'react';
import { MessageSender, MessageType } from '../../types/chat';
import QuoteCard from './QuoteCard';

/**
 * Scrollable list of chat message bubbles with timestamps, quotes, and typing indicator.
 *
 * @param {Object} props
 * @param {import('../../types/chat').ChatMessage[]} props.messages
 * @param {boolean} props.isTyping
 * @param {string} props.sellerName
 * @param {Function} props.onAcceptQuote
 * @param {Function} props.onNegotiateQuote
 */
export default function MessageList({
  messages = [],
  isTyping = false,
  sellerName = 'Seller',
  onAcceptQuote,
  onNegotiateQuote,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on message change or typing state
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50">
      {messages.map((msg) => {
        const isBuyer = msg.sender === MessageSender.BUYER;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
          >
            {/* Sender Name label */}
            <span className="text-[10px] text-gray-400 font-medium px-1 mb-1">
              {isBuyer ? 'You (Buyer)' : sellerName}
            </span>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                isBuyer
                  ? 'bg-brand-600 text-white rounded-br-xs'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
              }`}
            >
              {/* Product share card inside chat */}
              {msg.type === MessageType.PRODUCT && msg.productContext && (
                <div className="bg-white/10 rounded-xl p-2.5 mb-2 border border-white/20 text-left">
                  <div className="font-bold text-xs">{msg.productContext.name}</div>
                  <div className="text-[11px] opacity-90">
                    ₹{msg.productContext.price} • {msg.productContext.category}
                  </div>
                </div>
              )}

              {/* Text Message */}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Structured Quote Card if message is a quote */}
              {msg.type === MessageType.QUOTE && msg.quoteData && (
                <QuoteCard
                  quote={msg.quoteData}
                  onAccept={onAcceptQuote}
                  onNegotiate={onNegotiateQuote}
                />
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-1 text-right ${
                  isBuyer ? 'text-orange-200' : 'text-gray-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex flex-col items-start animate-in fade-in duration-150">
          <span className="text-[10px] text-gray-400 font-medium px-1 mb-1">
            {sellerName} is typing...
          </span>
          <div className="bg-white border border-gray-200/80 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
