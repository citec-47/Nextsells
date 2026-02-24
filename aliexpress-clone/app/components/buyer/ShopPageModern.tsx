'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, ChevronDown } from 'lucide-react';
import { useShopState } from './ShopStateProvider';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
  brand?: string;
  category: string;
}

interface CategoryCount {
  name: string;
  displayName: string;
  count: number;
  apiCategory?: string;
}

const CATEGORY_MAPPINGS: CategoryCount[] = [
  { name: 'all', displayName: 'All Categories', count: 0 },
  { name: 'kitchen', displayName: 'Kitchen Accessories', count: 0, apiCategory: 'kitchen-accessories' },
  { name: 'groceries', displayName: 'Groceries', count: 0, apiCategory: 'groceries' },
  { name: 'sports', displayName: 'Sports Accessories', count: 0, apiCategory: 'sports-accessories' },
  { name: 'smartphones', displayName: 'Smartphones', count: 0, apiCategory: 'smartphones' },
  { name: 'mobile', displayName: 'Mobile Accessories', count: 0, apiCategory: 'mobile-accessories' },
  { name: 'watches', displayName: 'Mens Watches', count: 0, apiCategory: 'mens-watches' },
  { name: 'beauty', displayName: 'Beauty', count: 0, apiCategory: 'beauty' },
  { name: 'fragrances', displayName: 'Fragrances', count: 0, apiCategory: 'fragrances' },
  { name: 'furniture', displayName: 'Furniture', count: 0, apiCategory: 'furniture' },
  { name: 'home', displayName: 'Home Decoration', count: 0, apiCategory: 'home-decoration' },
  { name: 'laptops', displayName: 'Laptops', count: 0, apiCategory: 'laptops' },
  { name: 'mens-shirts', displayName: 'Mens Shirts', count: 0, apiCategory: 'mens-shirts' },
  { name: 'mens-shoes', displayName: 'Mens Shoes', count: 0, apiCategory: 'mens-shoes' },
  { name: 'motorcycle', displayName: 'Motorcycle', count: 0, apiCategory: 'motorcycle' },
  { name: 'sunglasses', displayName: 'Sunglasses', count: 0, apiCategory: 'sunglasses' },
];

export default function ShopPageModern() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [perPage, setPerPage] = useState(40);
  const [searchWithin, setSearchWithin] = useState('');
  const [categories, setCategories] = useState<CategoryCount[]>(CATEGORY_MAPPINGS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const { addToCart, toggleWishlist, wishlistItems } = useShopState();

  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://dummyjson.com/products?limit=100');
        const data = await response.json();
        const fetchedProducts = (data.products || []).map((p: Product) => ({
          ...p,
          images: p.images || [p.thumbnail]
        }));
        setAllProducts(fetchedProducts);
        
        const categoryCounts = CATEGORY_MAPPINGS.map(cat => {
          if (cat.name === 'all') {
            return { ...cat, count: fetchedProducts.length };
          }
          const count = fetchedProducts.filter((p: Product) => 
            p.category === cat.apiCategory
          ).length;
          return { ...cat, count };
        });
        setCategories(categoryCounts);
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    let filtered = [...allProducts];

    if (selectedCategory !== 'all') {
      const categoryMapping = categories.find(c => c.name === selectedCategory);
      if (categoryMapping?.apiCategory) {
        filtered = filtered.filter(p => p.category === categoryMapping.apiCategory);
      }
    }

    if (searchWithin.trim()) {
      const query = searchWithin.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    setProducts(filtered);
  }, [selectedCategory, sortBy, searchWithin, allProducts, categories]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i < fullStars ? "#FFA500" : "none"} 
          className={i < fullStars ? "text-orange-400" : "text-gray-300"} 
        />
      );
    }
    return stars;
  };

  const renderProductCard = (product: Product) => {
    const isWishlisted = wishlistItems.some((item) => item.id === product.id);
    const salePrice = (product.price * (1 - (product.discountPercentage || 0) / 100)).toFixed(2);
    const discount = Math.round(product.discountPercentage || 0);
    const isVerified = product.rating >= 4.5;

    if (viewMode === 'grid') {
      return (
        <div
          key={product.id}
          className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all border border-gray-100"
        >
          <div className="relative overflow-hidden">
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
            {discount > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                -{discount}%
              </div>
            )}
          </div>
          <div className="p-4">
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded mb-2">
                ✓ Verified Seller
              </span>
            )}
            <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 h-10">
              {product.title}
            </h3>
            <div className="flex items-center gap-1 mb-2">
              {renderStars(product.rating)}
              <span className="text-xs text-gray-600 ml-1">({product.rating})</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-gray-900">${salePrice}</span>
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through">${product.price.toFixed(2)}</span>
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
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => addToCart(product)}
                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={product.id}
        className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all border border-gray-100"
      >
        <div className="flex gap-6 p-6">
          <div className="relative w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                -{discount}%
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded">
                  ✓ Verified Seller
                </span>
              )}
              {product.brand && (
                <span className="text-xs text-gray-500">{product.brand}</span>
              )}
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 capitalize">{product.category}</span>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-orange-600 cursor-pointer">
              {product.title}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{renderStars(product.rating)}</div>
              <span className="text-sm text-gray-600">
                {product.rating} ({Math.floor(Math.random() * 50) + 10})
              </span>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  ${salePrice}
                </span>
                {discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-2 rounded-lg border transition-colors ${
                    isWishlisted
                      ? 'bg-red-50 border-red-300 text-red-600'
                      : 'border-gray-300 text-gray-600 hover:border-red-300'
                  }`}
                >
                  <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>

                <button
                  onClick={() => addToCart(product)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">Shop</span>
        </div>

        <div className="flex gap-6">
          <aside className="w-72 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Filters</h3>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                  <span>Category</span>
                  <button className="text-gray-400" title="Toggle category filter" aria-label="Toggle category filter">
                    <ChevronDown size={18} />
                  </button>
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((cat) => (
                    <label
                      key={cat.name}
                      className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          value={cat.name}
                          checked={selectedCategory === cat.name}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{cat.displayName}</span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                  <input
                    type="search"
                    value={searchWithin}
                    onChange={(e) => setSearchWithin(e.target.value)}
                    placeholder="Search within results..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    {products.length} results
                  </span>

                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    title="Items per page"
                    aria-label="Items per page"
                  >
                    <option value={20}>20 / page</option>
                    <option value={40}>40 / page</option>
                    <option value={60}>60 / page</option>
                    <option value={100}>100 / page</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    title="Sort products"
                    aria-label="Sort products"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>

                  <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                    <button 
                      onClick={() => setViewMode('grid')}
                      disabled={viewMode === 'grid'}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-gray-800 text-white cursor-not-allowed' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 cursor-pointer'
                      }`}
                      title="Grid view"
                      aria-label="Grid view"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="1" width="6" height="6" rx="1"/>
                        <rect x="9" y="1" width="6" height="6" rx="1"/>
                        <rect x="1" y="9" width="6" height="6" rx="1"/>
                        <rect x="9" y="9" width="6" height="6" rx="1"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      disabled={viewMode === 'list'}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-gray-800 text-white cursor-not-allowed' 
                          : 'bg-white text-gray-600 hover:bg-gray-100 cursor-pointer'
                      }`}
                      title="List view"
                      aria-label="List view"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="14" height="3" rx="1"/>
                        <rect x="1" y="7" width="14" height="3" rx="1"/>
                        <rect x="1" y="12" width="14" height="3" rx="1"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                {[...Array(viewMode === 'grid' ? 8 : 5)].map((_, i) => (
                  <div key={i} className={`bg-white rounded-lg p-6 animate-pulse ${viewMode === 'list' ? 'flex gap-6' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'w-48 h-48' : 'w-full h-48'} bg-gray-200 rounded-lg flex-shrink-0`} />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      {viewMode === 'list' && <div className="h-20 bg-gray-200 rounded" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                {products.slice(0, perPage).map((product) => renderProductCard(product))}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchWithin('');
                  }}
                  className="text-orange-500 hover:underline font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
