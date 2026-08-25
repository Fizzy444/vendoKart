import React from 'react';

/**
 * ProductContext banner pinned at the top of the chat dialog.
 * Shows the exact product being inquired about or negotiated.
 *
 * @param {Object} props
 * @param {import('../../types/search').Product} props.product
 */
export default function ProductContext({ product }) {
  if (!product) return null;

  const { name, price, seller_name, category, image_url, manufacturing_days, stock } = product;

  // Category Icon helper
  const getCategoryIcon = (cat = '') => {
    const lower = cat.toLowerCase();
    if (lower.includes('wood') || lower.includes('toy')) return '🪵';
    if (lower.includes('pot') || lower.includes('decor') || lower.includes('clay')) return '🏺';
    if (lower.includes('cloth') || lower.includes('silk') || lower.includes('sari')) return '🧵';
    if (lower.includes('bag') || lower.includes('jute')) return '👜';
    if (lower.includes('footwear') || lower.includes('mojari')) return '👞';
    if (lower.includes('brass') || lower.includes('metal')) return '✨';
    return '📦';
  };

  return (
    <div className="bg-orange-50/70 border-b border-orange-100/90 px-3.5 py-2.5 flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Product thumbnail or emoji */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-orange-100 flex-shrink-0 flex items-center justify-center shadow-2xs">
          {image_url ? (
            <img src={image_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">{getCategoryIcon(category)}</span>
          )}
        </div>

        {/* Product Info */}
        <div className="min-w-0">
          <h5 className="text-xs font-bold text-gray-900 truncate leading-tight">
            {name}
          </h5>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
            <span className="font-semibold text-brand-600">₹{price?.toLocaleString('en-IN')}</span>
            <span>•</span>
            <span className="truncate">Stock: {stock ?? 'Available'}</span>
            {manufacturing_days && (
              <>
                <span>•</span>
                <span>Mfg: {manufacturing_days}d</span>
              </>
            )}
          </div>
        </div>
      </div>

      <span className="badge badge-orange text-[10px] flex-shrink-0 font-medium px-2 py-0.5">
        Context Item
      </span>
    </div>
  );
}
