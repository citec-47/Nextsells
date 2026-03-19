'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, User, Menu, X, Search, LogOut } from 'lucide-react';
import { useShopState } from '../buyer/ShopStateProvider';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { usePlatformBrand } from '@/app/hooks/usePlatformBrand';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount, wishlistCount } = useShopState();
  const { user, isAuthenticated, isLoading } = useAuth0User();
  const { platformName } = usePlatformBrand();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-2 text-xs md:text-sm">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden lg:inline text-white/90">Welcome to {platformName}</span>
            <Link href="/seller/onboarding" className="font-medium transition-colors hover:text-white/90">
              Become a Seller
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="text-white/90">Loading...</span>
            ) : isAuthenticated && user ? (
              <>
                <Link href="/profile" className="hidden items-center gap-1 transition-colors hover:text-white/90 sm:flex">
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <User size={14} />
                  )}
                  <span>{user.name?.split(' ')[0] || 'Profile'}</span>
                </Link>
                <span className="hidden text-white/50 sm:inline">|</span>
                <Link href="/buyer/orders" className="hidden transition-colors hover:text-white/90 sm:inline">
                  Orders
                </Link>
                <span className="hidden text-white/50 md:inline">|</span>
                <Link href="/auth/logout" className="flex items-center gap-1 transition-colors hover:text-white/90">
                  <LogOut size={14} className="md:hidden" />
                  <span className="hidden md:inline">Sign Out</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden transition-colors hover:text-white/90 sm:inline">
                  Sign In
                </Link>
                <span className="hidden text-white/50 sm:inline">|</span>
                <Link href="/auth/accounts" className="hidden transition-colors hover:text-white/90 sm:inline">
                  Create Account
                </Link>
                <span className="hidden text-white/50 md:inline">|</span>
                <Link href="/auth/login" className="flex items-center gap-1 transition-colors hover:text-white/90">
                  <User size={14} className="md:hidden" />
                  <span className="hidden md:inline">Account</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <Link href="/" className="flex-shrink-0" aria-label={`${platformName} Home`}>
              <h1 className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xl font-extrabold text-transparent md:text-3xl">
                {platformName}
              </h1>
            </Link>

            <form onSubmit={handleSearch} className="hidden max-w-2xl flex-1 md:flex" role="search">
              <div className="flex w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-700 outline-none"
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-white transition-all hover:from-orange-600 hover:to-orange-700"
                  aria-label="Submit search"
                >
                  <Search size={18} aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="hidden items-center gap-2 md:flex">
              <Link href="/buyer/wishlist" className="relative rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-600">
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/buyer/cart" className="relative rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-600">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="text-gray-700 md:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          <form onSubmit={handleSearch} className="mt-4 md:hidden" role="search">
            <div className="flex w-full overflow-hidden rounded-full border-2 border-orange-500">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 text-gray-700 outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="bg-orange-500 px-6 text-white transition-colors hover:bg-orange-600"
                aria-label="Submit search"
              >
                <Search size={20} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="border-t bg-gray-50 md:hidden" aria-label="Mobile navigation">
          <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded px-4 py-2 font-semibold text-blue-600 hover:bg-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt={user.name || 'User'}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <User size={18} />
                  )}
                  My Profile
                </Link>
                <Link href="/buyer/orders" className="rounded px-4 py-2 hover:bg-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  My Orders
                </Link>
                <Link href="/buyer/wishlist" className="rounded px-4 py-2 hover:bg-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  My Wishlist
                </Link>
                <Link href="/seller/dashboard" className="rounded px-4 py-2 hover:bg-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  Seller Dashboard
                </Link>
                <Link
                  href="/auth/logout"
                  className="rounded px-4 py-2 font-semibold text-red-600 hover:bg-red-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded px-4 py-2 font-semibold text-blue-600 hover:bg-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/accounts"
                  className="rounded px-4 py-2 font-semibold text-blue-600 hover:bg-gray-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Account
                </Link>
                <Link href="/buyer/orders" className="rounded px-4 py-2 hover:bg-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  My Orders
                </Link>
                <Link href="/seller/onboarding" className="rounded px-4 py-2 hover:bg-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  Sell on {platformName}
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
