'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, User, Menu, X, Search, LogOut } from 'lucide-react';
import { useShopState } from '../buyer/ShopStateProvider';
import { useAuth0User } from '@/lib/auth/auth0Client';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, wishlistCount } = useShopState();
  const { user, isAuthenticated, isLoading } = useAuth0User();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-xs md:text-sm">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden lg:inline text-white/90">Welcome to Nextsells</span>
            <Link href="/seller/onboarding" className="hover:text-white/90 transition-colors font-medium">
              Become a Seller
            </Link>
          </div>
          <d{isLoading ? (
              <span className="text-white/90">Loading...</span>
            ) : isAuthenticated ? (
              <>
                <Link href="/profile" className="hover:text-white/90 transition-colors hidden sm:inline flex items-center gap-1">
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  {user?.name?.split(' ')[0] || 'Profile'}
                </Link>
                <span className="text-white/50 hidden sm:inline">|</span>
                <Link href="/buyer/orders" className="hover:text-white/90 transition-colors hidden sm:inline">
                  Orders
                </Link>
                <span className="text-white/50 hidden md:inline">|</span>
                <a href="/api/auth/logout" className="hover:text-white/90 transition-colors flex items-center gap-1">
                  <LogOut size={14} className="md:hidden" />
                  <span className="hidden md:inline">Sign Out</span>
                </a>
              </>
            ) : (
              <>
                <a href="/api/auth/login" className="hover:text-white/90 transition-colors hidden sm:inline">
                  Sign In
                </a>
                <span className="text-white/50 hidden sm:inline">|</span>
                <Link href="/buyer/orders" className="hover:text-white/90 transition-colors hidden sm:inline">
                  Orders
                </Link>
                <span className="text-white/50 hidden md:inline">|</span>
                <a href="/api/auth/login" className="hover:text-white/90 transition-colors flex items-center gap-1">
                  <User size={14} className="md:hidden" />
                  <span className="hidden md:inline">Sign In</span>
                </a>
              </>
            )} className="hidden md:inline">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0" aria-label="Nextsells Home">
              <h1 className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">
                Nextsells
              </h1>
            </Link>

            {/* Search Bar */}
            <form 
              onSubmit={handleSearch} 
              className="flex-1 max-w-2xl hidden md:flex"
              role="search"
            >
              <div className="flex w-full bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-orange-400 transition-all">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  className="flex-1 px-4 py-2.5 outline-none text-gray-700 bg-transparent text-sm"
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2"
                  aria-label="Submit search"
                >
                  <Search size={18} aria-hidden="true" />
                </button>
              </div>
          </form>

          {/* Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="mt-4 md:hidden" role="search">
          <div className="flex w-full border-2 border-orange-500 rounded-full overflow-hidden">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 outline-none text-gray-700"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 hover:bg-orange-600 transition-colors"
              aria-label="Submit search"
            >
              <Search size={20} aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-gray-50 border-t" aria-label="Mobile navigation">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/profile"
                  className="py-2 px-4 hover:bg-gray-200 rounded font-semibold text-blue-600 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  My Profile
                </Link>
                <Link
                  href="/buyer/orders"
                  className="py-2 px-4 hover:bg-gray-200 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/buyer/wishlist"
                  className="py-2 px-4 hover:bg-gray-200 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Wishlist
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="py-2 px-4 hover:bg-gray-200 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Seller Dashboard
                </Link>
                <a
                  href="/api/auth/logout"
                  className="py-2 px-4 hover:bg-red-200 rounded text-red-600 font-semibold"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Out
                </a>
              </>
            ) : (
              <>
                <a
                  href="/api/auth/login"
                  className="py-2 px-4 hover:bg-gray-200 rounded font-semibold text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </a>
                <a
                  href="/api/auth/login?screen_hint=signup"
                  className="py-2 px-4 hover:bg-gray-200 rounded font-semibold text-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Account
                </a>
                <Link
                  href="/buyer/orders"
                  className="py-2 px-4 hover:bg-gray-200 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/seller/onboarding"
                  className="py-2 px-4 hover:bg-gray-200 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sell on Nextsells
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
