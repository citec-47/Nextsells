'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  sellingPrice: number;
  images: string[];
  stock: number;
  seller: {
    id: string;
    companyName: string;
    rating: number;
  };
}

export default function ProductBrowser() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buyer/products?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'All',
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Browse Products</h1>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
            />
            <button className="bg-indigo-700 hover:bg-indigo-800 px-6 py-2 rounded-lg font-semibold">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                  >
                    {/* Image */}
                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.title}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                        {product.title}
                      </h3>

                      {/* Price */}
                      <div className="mb-3">
                        <p className="text-2xl font-bold text-indigo-600">
                          ${product.sellingPrice.toFixed(2)}
                        </p>
                      </div>

                      {/* Seller Info */}
                      <div className="mb-3 pb-3 border-b">
                        <p className="text-sm text-gray-600">{product.seller.companyName}</p>
                        <div className="flex items-center text-yellow-500 text-sm">
                          {'⭐'.repeat(Math.round(product.seller.rating))}
                          <span className="text-gray-600 ml-1">
                            ({product.seller.rating.toFixed(1)})
                          </span>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="mb-4">
                        <p
                          className={`text-sm font-semibold ${
                            product.stock > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        disabled={product.stock === 0}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
