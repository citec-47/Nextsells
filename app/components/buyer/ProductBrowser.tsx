'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useShopState } from './ShopStateProvider';

interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  images: string[];
  thumbnail: string;
  stock: number;
  brand?: string;
  rating?: number;
}

interface DummyJsonResponse {
  products: DummyJsonProduct[];
}

interface BuyerProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  sellingPrice: number;
  images: string[];
  stock: number;
  seller?: {
    companyName: string;
    rating: number;
  };
}

interface Product {
  id: string | number;
  title: string;
  description?: string;
  category: string;
  price: number;
  discountPercentage?: number;
  images: string[];
  thumbnail: string;
  stock: number;
  sellerName?: string;
  sellerRating?: number;
}

const CATEGORY_CONFIG: Record<
  string,
  { primary: { source: 'category' | 'search'; value: string }; fallback?: { source: 'category' | 'search'; value: string } }
> = {
  phones: { primary: { source: 'category', value: 'smartphones' } },
  electronics: { primary: { source: 'category', value: 'laptops' } },
  fashion: { primary: { source: 'category', value: 'mens-shirts' }, fallback: { source: 'category', value: 'womens-dresses' } },
  home: { primary: { source: 'category', value: 'home-decoration' }, fallback: { source: 'category', value: 'furniture' } },
  sports: { primary: { source: 'category', value: 'sports-accessories' } },
  books: { primary: { source: 'category', value: 'books' } },
  bags: { primary: { source: 'category', value: 'womens-bags' }, fallback: { source: 'category', value: 'womens-shoes' } },
  gaming: { primary: { source: 'search', value: 'gaming' }, fallback: { source: 'category', value: 'mobile-accessories' } },
  watches: { primary: { source: 'category', value: 'mens-watches' }, fallback: { source: 'category', value: 'womens-watches' } },
  audio: { primary: { source: 'search', value: 'headphones' }, fallback: { source: 'category', value: 'mobile-accessories' } },
  gifts: { primary: { source: 'category', value: 'womens-jewellery' }, fallback: { source: 'search', value: 'gift' } },
};

export default function ProductBrowser() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useShopState();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const normalizedCategory = categoryParam ? categoryParam.toLowerCase() : 'All';
    if (normalizedCategory !== selectedCategory) {
      setSelectedCategory(normalizedCategory);
      setSearchQuery('');
    }
  }, [searchParams, selectedCategory]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      if (selectedCategory === 'All') {
        const endpoint = searchQuery
          ? `https://dummyjson.com/products/search?q=${encodeURIComponent(searchQuery)}`
          : 'https://dummyjson.com/products?limit=100';
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const data = (await response.json()) as DummyJsonResponse;
        const normalized = (data.products || []).map((item: DummyJsonProduct) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          price: item.price,
          discountPercentage: item.discountPercentage,
          images: item.images || [],
          thumbnail: item.thumbnail,
          stock: item.stock ?? 0,
          sellerName: item.brand,
          sellerRating: item.rating,
        }));
        setProducts(normalized);
        return;
      }

      const mappedCategory = CATEGORY_CONFIG[selectedCategory];
      if (mappedCategory) {
        const searchEndpoint = `https://dummyjson.com/products/search?q=${encodeURIComponent(searchQuery)}`;
        const endpoints = searchQuery
          ? [searchEndpoint]
          : [buildEndpoint(mappedCategory.primary), mappedCategory.fallback ? buildEndpoint(mappedCategory.fallback) : '']
              .filter(Boolean);

        let productsData: DummyJsonProduct[] = [];
        for (const endpoint of endpoints) {
          const response = await fetch(endpoint);
          if (!response.ok) continue;
          const data = (await response.json()) as DummyJsonResponse;
          if (data.products && data.products.length > 0) {
            productsData = data.products;
            break;
          }
        }

        const normalized = productsData.map((item: DummyJsonProduct) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: selectedCategory,
          price: item.price,
          discountPercentage: item.discountPercentage,
          images: item.images || [],
          thumbnail: item.thumbnail,
          stock: item.stock ?? 0,
          sellerName: item.brand,
          sellerRating: item.rating,
        }));
        setProducts(normalized);
        return;
      }

      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buyer/products?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = (await response.json()) as { success: boolean; data: BuyerProduct[] };
      if (data.success) {
        const normalized = (data.data || []).map((item: BuyerProduct) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          price: item.sellingPrice,
          images: item.images || [],
          thumbnail: item.images?.[0] || '/placeholder.jpg',
          stock: item.stock ?? 0,
          sellerName: item.seller?.companyName,
          sellerRating: item.seller?.rating,
        }));
        setProducts(normalized);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, fetchProducts]);

  const buildEndpoint = (entry: { source: 'category' | 'search'; value: string }) =>
    entry.source === 'category'
      ? `https://dummyjson.com/products/category/${entry.value}?limit=24`
      : `https://dummyjson.com/products/search?q=${encodeURIComponent(entry.value)}`;

  const categories = [
    'All',
    'phones',
    'electronics',
    'fashion',
    'home',
    'sports',
    'books',
    'bags',
    'gaming',
    'watches',
    'audio',
    'gifts',
  ];

  const formatCategoryLabel = (category: string) => {
    if (category === 'All') return category;
    const spaced = category.replace(/-/g, ' ');
    return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const queryString = params.toString();
    router.push(queryString ? `/buyer/products?${queryString}` : '/buyer/products');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="mb-3 md:mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Browse Products</h1>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 md:px-4 py-2 rounded-lg text-gray-900 text-sm md:text-base"
            />
            <button className="bg-indigo-700 hover:bg-indigo-800 px-4 md:px-6 py-2 rounded-lg font-semibold text-sm md:text-base">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-8">
        {/* Mobile Category Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden mb-3 w-full bg-white rounded-lg shadow px-3 py-2 text-sm font-semibold text-gray-900 flex items-center justify-between"
        >
          <span>Categories: {formatCategoryLabel(selectedCategory)}</span>
          <span>{isSidebarOpen ? '▲' : '▼'}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-8">
          {/* Sidebar - Categories */}
          <div className={`lg:col-span-1 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:sticky lg:top-20">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      handleCategorySelect(cat);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 md:px-4 py-2 rounded-lg transition text-sm md:text-base ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {formatCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 md:h-96">
                <div className="animate-spin rounded-full h-10 md:h-12 w-10 md:w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 md:p-8 text-center">
                <p className="text-gray-600 text-base md:text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col h-full"
                  >
                    {/* Image */}
                    <div className="w-full h-28 sm:h-32 md:h-40 bg-gray-200 overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={product.thumbnail || product.images[0] || '/placeholder.jpg'}
                        alt={product.title}
                        fill
                        className="object-cover hover:scale-105 transition"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-1.5 sm:p-3 flex flex-col flex-1">
                      <h3 className="text-[10px] sm:text-sm font-semibold text-gray-900 line-clamp-2 mb-1 sm:mb-2 min-h-[1.75rem] sm:min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Price */}
                      <div className="mb-1 sm:mb-2">
                        <p className="text-sm sm:text-lg md:text-xl font-bold text-indigo-600">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Stock - compact */}
                      <div className="mb-1 sm:mb-2">
                        <p
                          className={`text-[9px] sm:text-xs font-semibold ${
                            product.stock > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {product.stock > 0 ? 'In stock' : 'Out of stock'}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        disabled={product.stock === 0}
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            discountPercentage: product.discountPercentage ?? 0,
                            rating: product.sellerRating ?? 0,
                            thumbnail: product.thumbnail || product.images[0] || '/placeholder.jpg',
                            images: product.images,
                            category: product.category,
                            tags: [],
                            brand: product.sellerName,
                          })
                        }
                        className="w-full bg-indigo-600 text-white py-1 sm:py-2 rounded-lg text-[10px] sm:text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
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
