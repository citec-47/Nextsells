'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Welcome to Nextsells</span>
            <Link href="/seller/onboarding" className="hover:underline">
              Sell on Nextsells
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/buyer/orders" className="hover:underline">
              My Orders
            </Link>
            <Link href="/buyer/dashboard" className="hover:underline flex items-center gap-1">
              <User size={16} aria-hidden="true" />
              <span>Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Nextsells Home">
            <h1 className="text-2xl md:text-3xl font-bold text-orange-500">
              Nextsells
            </h1>
          </Link>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch} 
            className="flex-1 max-w-3xl hidden md:flex"
            role="search"
          >
            <div className="flex w-full border-2 border-orange-500 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-orange-400">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="flex-1 px-6 py-3 outline-none text-gray-700"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="bg-orange-500 text-white px-8 hover:bg-orange-600 transition-colors"
                aria-label="Submit search"
              >
                <Search size={20} aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/buyer/checkout"
              className="relative group"
              aria-label="Shopping cart"
            >
              <ShoppingCart 
                size={28} 
                className="text-gray-700 group-hover:text-orange-500 transition-colors" 
                aria-hidden="true"
              />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Link>

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
            <Link
              href="/buyer/orders"
              className="py-2 px-4 hover:bg-gray-200 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Orders
            </Link>
            <Link
              href="/buyer/dashboard"
              className="py-2 px-4 hover:bg-gray-200 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Account
            </Link>
            <Link
              href="/seller/onboarding"
              className="py-2 px-4 hover:bg-gray-200 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sell on Nextsells
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
