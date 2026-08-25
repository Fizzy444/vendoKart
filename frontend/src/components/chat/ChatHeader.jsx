import React from 'react';

/**
 * ChatHeader component displaying seller profile, online status, verified badge, and window controls.
 *
 * @param {Object} props
 * @param {string} props.sellerName
 * @param {string} props.sellerLocation
 * @param {boolean} [props.isOnline=true]
 * @param {boolean} [props.isVerified=true]
 * @param {Function} props.onMinimize
 * @param {Function} props.onClose
 */
export default function ChatHeader({
  sellerName = 'Artisan Seller',
  sellerLocation = 'India',
  isOnline = true,
  isVerified = true,
  onMinimize,
  onClose,
}) {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-brand-600 to-orange-600 text-white flex items-center justify-between shadow-sm select-none">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar with Online indicator dot */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-base font-bold text-white shadow-inner">
            {sellerName.charAt(0)}
          </div>
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-brand-600"
              title="Online"
            />
          )}
        </div>

        {/* Seller Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold truncate leading-snug">{sellerName}</h4>
            {isVerified && (
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-400 text-white text-[9px] font-black"
                title="Verified Artisan Seller"
              >
                ✓
              </span>
            )}
          </div>
          <p className="text-[11px] text-orange-100/90 truncate flex items-center gap-1">
            <span>{sellerLocation}</span>
            <span>•</span>
            <span className="text-green-300 font-medium">Online</span>
          </p>
        </div>
      </div>

      {/* Action Window Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinimize}
          className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors"
          title="Minimize Chat"
          aria-label="Minimize Chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 12H5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 text-white/90 hover:text-white transition-colors"
          title="Close Chat"
          aria-label="Close Chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
