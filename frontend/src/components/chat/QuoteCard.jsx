import React from 'react';
import { QuoteStatus } from '../../types/chat';

/**
 * Interactive Seller Quote Card component rendered inside chat messages.
 *
 * @param {Object} props
 * @param {import('../../types/chat').QuoteData} props.quote
 * @param {Function} props.onAccept
 * @param {Function} props.onNegotiate
 */
export default function QuoteCard({ quote, onAccept, onNegotiate }) {
  if (!quote) return null;

  const { id, productName, quantity, unitPrice, totalPrice, productionDays, status } = quote;

  return (
    <div className="mt-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-sm text-left max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-amber-200/60">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📋</span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
            Official Seller Quote
          </h4>
        </div>
        
        {/* Status Badge */}
        {status === QuoteStatus.ACCEPTED ? (
          <span className="badge bg-green-100 text-green-700 text-[10px] font-bold">
            ✓ Accepted
          </span>
        ) : status === QuoteStatus.NEGOTIATING ? (
          <span className="badge bg-purple-100 text-purple-700 text-[10px] font-bold">
            💬 Negotiating
          </span>
        ) : (
          <span className="badge bg-amber-100 text-amber-800 text-[10px] font-bold">
            ● Pending Action
          </span>
        )}
      </div>

      {/* Quote Details Table */}
      <div className="space-y-1.5 text-xs text-gray-700 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Product:</span>
          <span className="font-semibold text-gray-900 truncate max-w-[180px]">{productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Quantity:</span>
          <span className="font-semibold text-gray-900">{quantity} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Unit Price:</span>
          <span className="font-semibold text-gray-900">₹{unitPrice?.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Production Lead Time:</span>
          <span className="font-semibold text-gray-900">≤ {productionDays} days</span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-amber-200/60 text-sm">
          <span className="font-bold text-gray-900">Total Price:</span>
          <span className="font-extrabold text-brand-700">₹{totalPrice?.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Actions */}
      {status === QuoteStatus.PENDING && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onAccept(id)}
            className="flex-1 py-1.5 px-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Accept Quote
          </button>
          <button
            type="button"
            onClick={() => onNegotiate(id)}
            className="py-1.5 px-3 bg-white hover:bg-amber-100 text-gray-700 rounded-xl text-xs font-semibold border border-amber-300 transition-colors"
          >
            Negotiate
          </button>
        </div>
      )}
    </div>
  );
}
