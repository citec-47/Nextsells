'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, User, Menu, X, Search, ChevronDown, Store } from 'lucide-react';
import { useShopState } from '../buyer/ShopStateProvider';
import TopPromoBanner from './TopPromoBanner';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function ModernHeader({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const { cartCount, wishlistCount } = useShopState();

  const categoryOptions = [
    'All Categories',
    'Electronics',
    'Fashion',
    'Home',
    'Beauty',
    'Groceries',
    'Sports',
    'Automotive',
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    }

    if (showAccountMenu || showCategoryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccountMenu, showCategoryMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Promo Banner */}
      <TopPromoBanner />
      
      {/* Main Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Store size={24} className="text-white" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800 hidden sm:block">
                Market<span className="text-orange-500">Hub</span>
              </h1>
            </Link>

            {/* Search Bar with Category Dropdown */}
            <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
              <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                <div className="relative hidden md:flex" ref={categoryMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryMenu((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 whitespace-nowrap"
                    aria-haspopup="menu"
                    aria-expanded={showCategoryMenu}
                  >
                    <span>{selectedCategory}</span>
                    <ChevronDown size={16} />
                  </button>

                  {showCategoryMenu && (
                    <div className="absolute left-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1 z-50">
                      {categoryOptions.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowCategoryMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                            selectedCategory === category
                              ? 'text-blue-600 font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories..."
                  className="flex-1 px-4 py-2.5 outline-none text-sm bg-white min-w-0"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Search size={18} />
                  <span className="hidden sm:block">Search</span>
                </button>
              </div>
            </form>

            {/* Navigation Icons */}
            <div className="flex items-center gap-1 lg:gap-3">
              {/* Shop */}
              <Link 
                href="/buyer/products" 
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Store size={20} />
                <span className="text-sm font-medium">Shop</span>
              </Link>

              {/* Wishlist */}
              <Link 
                href="/buyer/wishlist" 
                className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors relative"
              >
                <div className="relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium hidden lg:block">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link 
                href="/buyer/cart" 
                className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors relative"
              >
                <div className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium hidden lg:block">Cart</span>
              </Link>

              {/* Account Dropdown */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                  aria-label="Account menu"
                >
                  <User size={20} />
                  <span className="text-sm font-medium hidden lg:block">Account</span>
                  <ChevronDown size={16} className="hidden lg:block" />
                </button>

                {/* Account Dropdown Menu */}
                {showAccountMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Welcome to MarketHub</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">Sign in to your account</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/auth/login"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-medium"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Create Account
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-2">
                      <Link
                        href="/seller/onboarding"
                        className="block px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Start Selling
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-gray-700 p-2 ml-2"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/buyer/products"
              className="py-3 px-4 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Store size={18} />
              Shop
            </Link>
            <Link
              href="/auth/accounts"
              className="py-3 px-4 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={18} />
              Sign In / Register
            </Link>
            <Link
              href="/buyer/orders"
              className="py-3 px-4 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📦 My Orders
            </Link>
            <Link
              href="/seller/onboarding"
              className="py-3 px-4 hover:bg-orange-50 rounded-lg text-sm font-medium text-orange-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              💼 Start Selling
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
