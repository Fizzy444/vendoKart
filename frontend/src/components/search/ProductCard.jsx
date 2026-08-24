import React, { useState } from 'react';

/**
 * Individual Product Card component.
 * Grounded directly in seller dataset records.
 *
 * @param {Object} props
 * @param {import('../../types/search').Product} props.product
 */
export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);

  const {
    name,
    category,
    description,
    price,
    stock,
    manufacturing_days,
    seller_name,
    seller_location,
    image_url,
  } = product;

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
    <div className="product-card flex flex-col justify-between group h-full">
      <div>
        {/* Card Header with Image & Badges */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-4 border border-gray-100 flex items-center justify-center">
          {image_url && !imageError ? (
            <img
              src={image_url}
              alt={name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl">{getCategoryIcon(category)}</span>
              <span className="text-xs font-medium mt-2">{category}</span>
            </div>
          )}

          {/* Top category badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="badge badge-orange bg-white/90 backdrop-blur-sm text-brand-700 shadow-xs border border-orange-100 text-[11px] font-semibold">
              {getCategoryIcon(category)} {category}
            </span>
          </div>

          {/* Lead time badge */}
          {manufacturing_days !== undefined && manufacturing_days !== null && (
            <div className="absolute bottom-2.5 right-2.5">
              <span className="badge bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium">
                ⚡ Mfg: {manufacturing_days} {manufacturing_days === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
        </div>

        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-base font-bold text-gray-900 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
            {name}
          </h4>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-extrabold text-gray-900">
              ₹{price?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>

        {/* Seller Info Section */}
        <div className="bg-gray-50/80 rounded-xl p-3 mb-4 border border-gray-100 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{seller_name || 'Verified Artisan'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {seller_location || 'India'}
            </span>

            {stock !== undefined && stock !== null && (
              <span className={`font-medium ${stock > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                Stock: {stock} units
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <button
        type="button"
        onClick={() => alert(`Selected Product: ${name}\nSeller: ${seller_name}\nPrice: ₹${price}`)}
        className="w-full py-2.5 px-4 bg-brand-50 hover:bg-brand-500 text-brand-700 hover:text-white rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-2xs group-hover:bg-brand-500 group-hover:text-white"
      >
        <span>View Product Details</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
