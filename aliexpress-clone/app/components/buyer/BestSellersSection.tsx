'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, TrendingUp } from 'lucide-react';
import { useShopState } from './ShopStateProvider';

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
  images: string[];
  category: string;
}

export default function BestSellersSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, toggleWishlist, wishlistItems } = useShopState();

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products?limit=12');
        const data = await response.json();
        // Sort by rating to simulate best sellers
        const sorted = data.products
          .slice(0, 12)
          .sort((a: Product, b: Product) => b.rating - a.rating);
        setProducts(sorted);
      } catch (error) {
        console.error('Failed to load best sellers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-500" />
            Best Sellers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-300 animate-pulse rounded-lg h-64" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-green-500" />
            Best Sellers
          </h2>
          <Link
            href="/buyer/products"
            className="text-orange-500 hover:text-orange-600 font-semibold text-sm md:text-base"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {products.map((product, index) => {
            const isWishlisted = wishlistItems.some((item) => item.id === product.id);
            const discount = Math.round(product.discountPercentage);

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="relative overflow-hidden h-32 md:h-40 bg-gray-200">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {index < 3 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      #{index + 1}
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{discount}%
                    </div>
                  )}
                </div>
                <div className="p-2 md:p-3">
                  <p className="text-xs md:text-sm font-semibold text-gray-700 line-clamp-2 mb-2">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-900 font-bold text-sm md:text-base">
                      ₹
                      {(
                        product.price *
                        (1 - product.discountPercentage / 100)
                      ).toFixed(2)}
                    </span>
                    {discount > 0 && (
                      <span className="text-gray-500 line-through text-xs md:text-sm">
                        ₹{product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-sm">
                          {i < Math.floor(product.rating) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">
                      ({product.rating.toFixed(1)})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm py-1.5 rounded font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <ShoppingCart size={14} />
                      <span className="hidden md:inline">Cart</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`px-2 py-1.5 rounded border transition-colors ${
                        isWishlisted
                          ? 'bg-red-100 border-red-300 text-red-600'
                          : 'bg-gray-100 border-gray-300 text-gray-600 hover:border-red-300'
                      }`}
                      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
