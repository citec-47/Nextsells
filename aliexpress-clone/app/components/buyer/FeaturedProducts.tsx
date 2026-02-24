'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useShopState } from './ShopStateProvider';

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
  stock: number;
  images: string[];
  category: string;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const { addToCart, toggleWishlist, wishlistItems } = useShopState();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products?limit=50');
        const data = await response.json();
        const productsWithImages = data.products.map((p: Product) => ({
          ...p,
          images: p.images || [p.thumbnail]
        }));
        setProducts(productsWithImages);
      } catch (error) {
        console.error('Failed to load featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={12} 
          fill={i < fullStars ? "#FFA500" : "none"} 
          className={i < fullStars ? "text-orange-400" : "text-gray-300"} 
        />
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-72" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
            <p className="text-sm text-gray-600">
              Handpicked deals from verified sellers
            </p>
          </div>
          <Link
            href="/buyer/products"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group"
          >
            View All
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, displayCount).map((product) => {
            const isWishlisted = wishlistItems.some((item) => item.id === product.id);
            const salePrice = (product.price * (1 - product.discountPercentage / 100)).toFixed(2);
            const discount = Math.round(product.discountPercentage);
            const isVerified = product.rating >= 4.0;
            const isLowStock = product.stock < 10;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all border border-gray-100 group"
              >
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{discount}%
                    </div>
                  )}
                  {isLowStock && (
                    <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                      Only {product.stock} left
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  {isVerified && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-orange-600 font-medium">✓ Verified Seller</span>
                    </div>
                  )}

                  <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 h-10">
                    {product.title}
                  </h3>

                  <div className="flex items-center gap-1 mb-2">
                    {renderStars(product.rating)}
                    <span className="text-xs text-gray-600 ml-1">
                      {product.rating.toFixed(1)} ({Math.floor(Math.random() * 30) + 3})
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-gray-900">
                      ${salePrice}
                    </span>
                    {discount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleWishlist(product)}
                      className={`p-2 rounded-lg border transition-colors ${
                        isWishlisted
                          ? 'bg-red-50 border-red-300 text-red-600'
                          : 'border-gray-300 text-gray-600 hover:border-red-300'
                      }`}
                      aria-label="Add to wishlist"
                    >
                      <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <ShoppingCart size={14} />
                      <span className="hidden sm:inline">Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {displayCount < products.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setDisplayCount(prev => Math.min(prev + 10, products.length))}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Load More Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
