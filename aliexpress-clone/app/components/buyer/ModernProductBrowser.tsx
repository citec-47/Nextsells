'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, StarHalf, Filter, X, ChevronDown, Grid, List } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useShopState } from './ShopStateProvider';

interface Product {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  thumbnail: string;
  brand?: string;
  category: string;
  images: string[];
}

export default function ModernProductBrowser() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const searchParams = useSearchParams();
  const { addToCart, toggleWishlist, wishlistItems } = useShopState();

  const category = searchParams.get('category') || 'All';

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const url = category === 'All' 
          ? 'https://dummyjson.com/products?limit=30'
          : `https://dummyjson.com/products/category/${category}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        let filteredProducts = data.products || [];
        
        // Apply filters
        filteredProducts = filteredProducts.filter((p: Product) => {
          const price = p.price * (1 - (p.discountPercentage || 0) / 100);
          return price >= priceRange[0] && price <= priceRange[1] && p.rating >= selectedRating;
        });
        
        // Apply sorting
        switch (sortBy) {
          case 'price-low':
            filteredProducts.sort((a: Product, b: Product) => a.price - b.price);
            break;
          case 'price-high':
            filteredProducts.sort((a: Product, b: Product) => b.price - a.price);
            break;
          case 'rating':
            filteredProducts.sort((a: Product, b: Product) => b.rating - a.rating);
            break;
          case 'discount':
            filteredProducts.sort((a: Product, b: Product) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
            break;
        }
        
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category, sortBy, priceRange, selectedRating]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={14} fill="#FFA500" className="text-orange-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={14} fill="#FFA500" className="text-orange-400" />);
    }
    while (stars.length < 5) {
      stars.push(<Star key={`empty-${stars.length}`} size={14} className="text-gray-300" />);
    }
    return stars;
  };

  const FilterSidebar = () => (
    <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Filters</h3>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden text-gray-500"
          title="Close filters"
          aria-label="Close filters"
        >
          <X size={20} />
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Price Range</h4>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Min"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 2000])}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="Max"
          />
        </div>
        <input
          type="range"
          min="0"
          max="2000"
          step="50"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
          className="w-full accent-orange-500"
          title="Select maximum price"
          aria-label="Maximum price range slider"
        />
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Rating</h4>
        {[4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setSelectedRating(rating)}
            className={`flex items-center gap-2 w-full py-2 px-3 rounded-lg mb-2 transition-colors ${
              selectedRating === rating ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'
            }`}
            title={`Filter by ${rating} stars and up`}
            aria-label={`Filter by ${rating} stars and up`}
          >
            <div className="flex">{renderStars(rating)}</div>
            <span className="text-sm text-gray-600">& Up</span>
          </button>
        ))}
        {selectedRating > 0 && (
          <button
            onClick={() => setSelectedRating(0)}
            className="text-orange-500 text-sm font-medium hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Discount */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Discount</h4>
        {['50% or more', '40% or more', '30% or more', '20% or more', '10% or more'].map((discount) => (
          <label key={discount} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 px-2 rounded">
            <input type="checkbox" className="accent-orange-500" />
            <span className="text-sm text-gray-700">{discount}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-500">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium capitalize">{category}</span>
        </div>

        {/* Header with Filters and Sort */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Filters</span>
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
              {category === 'All' ? 'All Products' : category}
            </h2>
            <span className="text-sm text-gray-500">
              ({products.length} products)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="hidden md:flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                title="List view"
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              title="Sort products"
              aria-label="Sort products"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="discount">Best Discount</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-3" />
                    <div className="bg-gray-200 h-4 rounded mb-2" />
                    <div className="bg-gray-200 h-4 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'flex flex-col gap-4'
              }>
                {products.map((product) => {
                  const isWishlisted = wishlistItems.some((item) => item.id === product.id);
                  const salePrice = (product.price * (1 - (product.discountPercentage || 0) / 100)).toFixed(2);
                  const discount = Math.round(product.discountPercentage || 0);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all group border border-gray-100"
                    >
                      <div className="relative overflow-hidden">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {discount > 0 && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            -{discount}%
                          </div>
                        )}
                        <button
                          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          onClick={() => toggleWishlist(product)}
                          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          className={`absolute top-2 right-2 p-2 rounded-full ${
                            isWishlisted ? 'bg-red-100 text-red-500' : 'bg-white/90 text-gray-600'
                          } hover:scale-110 transition-transform`}
                        >
                          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="p-3">
                        {product.brand && (
                          <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                        )}
                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 h-10">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-1 mb-2">
                          {renderStars(product.rating)}
                          <span className="text-xs text-gray-600 ml-1">({product.rating})</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-lg font-bold text-gray-900">₹{salePrice}</span>
                          {discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">₹{product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={16} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && products.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <button
                  onClick={() => {
                    setPriceRange([0, 2000]);
                    setSelectedRating(0);
                  }}
                  className="mt-4 text-orange-500 hover:underline font-medium"
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
