'use client';

import { useUserRole } from '@/app/hooks/useUserRole';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { usePlatformBrand } from '@/app/hooks/usePlatformBrand';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function RoleBasedNav() {
  const { isSeller, isAdmin, isBuyer } = useUserRole();
  const { user, isAuthenticated, isLoading } = useAuth0User();
  const { platformName } = usePlatformBrand();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            {platformName}
          </Link>

          <div className="flex gap-6 items-center">
            {/* Common Links */}
            <Link href="/buyer/products" className="text-gray-600 hover:text-blue-600">
              Shop
            </Link>

            {/* Buyer Links */}
            {isAuthenticated && isBuyer && (
              <>
                <Link href="/buyer/cart" className="text-gray-600 hover:text-blue-600">
                  Cart
                </Link>
                <Link href="/buyer/orders" className="text-gray-600 hover:text-blue-600">
                  Orders
                </Link>
              </>
            )}

            {/* Seller Links */}
            {isAuthenticated && isSeller && (
              <>
                <Link href="/seller/products" className="text-gray-600 hover:text-blue-600">
                  Products
                </Link>
                <Link href="/seller/dashboard" className="text-gray-600 hover:text-blue-600">
                  Dashboard
                </Link>
              </>
            )}

            {/* Admin Links */}
            {isAuthenticated && isAdmin && (
              <>
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-blue-600">
                  Admin
                </Link>
                <Link href="/admin/sellers" className="text-gray-600 hover:text-blue-600">
                  Sellers
                </Link>
              </>
            )}

            {/* Auth Section */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              {isLoading ? (
                <span className="text-gray-600 text-sm">Loading...</span>
              ) : isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{user.name?.split(' ')[0]}</span>
                  </div>
                  <Link href="/profile" className="text-gray-600 hover:text-blue-600 text-sm">
                    Profile
                  </Link>
                  <Link
                    href="/auth/logout"
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/accounts"
                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
