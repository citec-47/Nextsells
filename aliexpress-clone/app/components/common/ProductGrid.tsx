'use client';

import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  discount?: number;
}

// Sample products data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 29.99,
    originalPrice: 59.99,
    rating: 4.5,
    reviews: 1234,
    image: '/api/placeholder/300/300',
    badge: 'Top Seller',
    discount: 50,
  },
  {
    id: '2',
    name: 'Smart Watch Fitness Tracker',
    price: 49.99,
    originalPrice: 99.99,
    rating: 4.7,
    reviews: 856,
    image: '/api/placeholder/300/300',
    badge: 'Hot Deal',
    discount: 50,
  },
  {
    id: '3',
    name: 'USB-C Fast Charging Cable',
    price: 9.99,
    originalPrice: 19.99,
    rating: 4.3,
    reviews: 2341,
    image: '/api/placeholder/300/300',
    discount: 50,
  },
  {
    id: '4',
    name: 'Portable Power Bank 20000mAh',
    price: 24.99,
    originalPrice: 44.99,
    rating: 4.6,
    reviews: 678,
    image: '/api/placeholder/300/300',
    badge: 'New',
    discount: 44,
  },
  {
    id: '5',
    name: 'Wireless Gaming Mouse RGB',
    price: 34.99,
    originalPrice: 69.99,
    rating: 4.8,
    reviews: 423,
    image: '/api/placeholder/300/300',
    discount: 50,
  },
  {
    id: '6',
    name: 'Mechanical Keyboard Cherry MX',
    price: 79.99,
    originalPrice: 129.99,
    rating: 4.9,
    reviews: 891,
    image: '/api/placeholder/300/300',
    badge: 'Hot Deal',
    discount: 38,
  },
  {
    id: '7',
    name: 'HD Webcam 1080P with Microphone',
    price: 39.99,
    originalPrice: 79.99,
    rating: 4.4,
    reviews: 567,
    image: '/api/placeholder/300/300',
    discount: 50,
  },
  {
    id: '8',
    name: 'Bluetooth Speaker Waterproof',
    price: 19.99,
    originalPrice: 39.99,
    rating: 4.5,
    reviews: 1456,
    image: '/api/placeholder/300/300',
    badge: 'Top Seller',
    discount: 50,
  },
];

interface ProductGridProps {
  title?: string;
  products?: Product[];
  columns?: number;
}

export default function ProductGrid({
  title = 'Popular Products',
  products = sampleProducts,
  columns = 4,
}: ProductGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  }[columns] || 'md:grid-cols-4';

  return (
    <section className="py-8" aria-labelledby="product-grid-title">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 id="product-grid-title" className="text-xl md:text-2xl font-bold text-gray-800">
            {title}
          </h2>
          <Link
            href="/buyer/products"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            View All →
          </Link>
        </div>

        <div className={`grid grid-cols-2 ${gridCols} gap-4 md:gap-6`}>
          {products.map((product) => (
            <article
              key={product.id}
              className="bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all overflow-hidden group"
            >
              <Link href={`/buyer/products/${product.id}`} className="block">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-gray-400 text-sm">Product Image</span>
                  </div>
                  
                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {product.badge}
                    </span>
                  )}
                  
                  {/* Discount */}
                  {product.discount && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{product.discount}%
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center" aria-label={`Rating: ${product.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg md:text-xl font-bold text-orange-500">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    aria-label={`Add ${product.name} to cart`}
                    onClick={(e) => {
                      e.preventDefault();
                      // Handle add to cart
                    }}
                  >
                    <ShoppingCart size={16} aria-hidden="true" />
                    <span className="text-sm">Add to Cart</span>
                  </button>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
