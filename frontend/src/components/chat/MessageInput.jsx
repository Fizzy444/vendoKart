import React, { useState, useRef } from 'react';

/**
 * Message input component with quick action prompt chips and attachment button.
 *
 * @param {Object} props
 * @param {Function} props.onSendMessage
 * @param {Function} props.onQuickAction
 * @param {boolean} [props.disabled=false]
 */
export default function MessageInput({ onSendMessage, onQuickAction, disabled = false }) {
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMessage(`📎 [Attached File]: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      e.target.value = '';
    }
  };

  const quickActions = [
    { label: '🎨 Customization', type: 'CUSTOMIZATION' },
    { label: '💰 Ask for Quote', type: 'QUOTE' },
    { label: '🚚 Delivery Time', type: 'DELIVERY' },
    { label: '📦 Share Product', type: 'SEND_PRODUCT' },
  ];

  return (
    <div className="border-t border-gray-100 bg-white p-3 space-y-2.5">
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {quickActions.map((action) => (
          <button
            key={action.type}
            type="button"
            onClick={() => onQuickAction(action.type)}
            disabled={disabled}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-orange-50/80 hover:bg-brand-100 active:bg-brand-200 text-brand-800 text-[11px] font-medium transition-colors border border-orange-200/50 disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach Image or File"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your message to the seller..."
          className="flex-1 text-xs sm:text-sm bg-gray-50 border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-gray-400 disabled:opacity-50"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          className="p-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:bg-gray-200 text-white rounded-xl transition-all shadow-2xs flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
          title="Send Message"
          aria-label="Send Message"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
