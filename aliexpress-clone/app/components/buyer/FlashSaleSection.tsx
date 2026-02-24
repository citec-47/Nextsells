'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useShopState } from './ShopStateProvider';

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
}

export default function FlashSaleSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0,
  });
  const { wishlistItems } = useShopState();

  useEffect(() => {
    const fetchFlashSaleProducts = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products?limit=8');
        const data = await response.json();
        setProducts(
          data.products
            .filter((p: Product) => p.discountPercentage >= 20)
            .slice(0, 8)
        );
      } catch (error) {
        console.error('Failed to load flash sale products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashSaleProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 24;
          minutes = 0;
          seconds = 0;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">⚡ Flash Sale</h2>
            <div className="flex gap-4 text-sm">
              {['Hours', 'Minutes', 'Seconds'].map((label) => (
                <div key={label} className="bg-white/20 px-3 py-2 rounded">
                  <div className="animate-pulse bg-gray-300 h-6 w-12 rounded" />
                </div>
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
        {/* Header with countdown */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Flash Deals</h2>
            <div className="flex gap-2">
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                <div className="text-xl font-bold text-white">
                  {formatTime(timeLeft.hours)}
                </div>
                <div className="text-[10px] text-gray-300 uppercase">HRS</div>
              </div>
              <div className="flex items-center text-xl font-bold text-gray-800">:</div>
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                <div className="text-xl font-bold text-white">
                  {formatTime(timeLeft.minutes)}
                </div>
                <div className="text-[10px] text-gray-300 uppercase">MIN</div>
              </div>
              <div className="flex items-center text-xl font-bold text-gray-800">:</div>
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                <div className="text-xl font-bold text-white">
                  {formatTime(timeLeft.seconds)}
                </div>
                <div className="text-[10px] text-gray-300 uppercase">SEC</div>
              </div>
            </div>
          </div>
          <Link
            href="/buyer/products"
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group"
          >
            View All
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {products.map((product) => {
            const isWishlisted = wishlistItems.some((item) => item.id === product.id);
            const salePrice = (
              product.price *
              (1 - product.discountPercentage / 100)
            ).toFixed(2);
            const discount = Math.round(product.discountPercentage);
            const isVerified = product.rating >= 4.0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all border border-gray-100 group"
              >
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{discount}%
                  </div>
                </div>
                <div className="p-2 md:p-3">
                  {isVerified && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-orange-600 font-medium">✓ Verified Seller</span>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700 line-clamp-2 mb-2 h-8">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-xs text-gray-600">
                      {product.rating.toFixed(1)} ({Math.floor(Math.random() * 20) + 3})
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm md:text-base font-bold text-gray-900">
                      ${salePrice}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ${product.price.toFixed(2)}
                    </span>
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
