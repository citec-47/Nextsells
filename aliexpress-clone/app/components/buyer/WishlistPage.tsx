'use client';

import { Heart, Home } from 'lucide-react';
import Link from 'next/link';
import ModernHeader from '../common/ModernHeader';
import { useShopState } from './ShopStateProvider';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist } = useShopState();

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 md:gap-2 bg-gray-100 text-gray-700 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-200"
              aria-label="Back to home"
            >
              <Home size={14} className="md:w-4 md:h-4" aria-hidden="true" />
              Home
            </Link>
            <Heart size={20} className="md:w-6 md:h-6 text-rose-500" aria-hidden="true" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Wishlist</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Keep track of items you love.</p>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg md:rounded-2xl border border-gray-100 p-6 md:p-8 text-center text-gray-500 text-sm md:text-base">
            No items saved yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {wishlistItems.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-lg md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="h-32 sm:h-36 md:h-48 bg-gray-100 flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 sm:p-3 md:p-4 space-y-2 md:space-y-3 flex flex-col flex-1">
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-xs md:text-xs text-orange-600 uppercase">{item.category}</p>
                    <h2 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                      {item.title}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                      {currencyFormatter.format(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(item)}
                      className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
