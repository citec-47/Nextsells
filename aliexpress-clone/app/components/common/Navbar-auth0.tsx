

'use client';

import Link from 'next/link';
import { useAuth0User, getLoginUrl, getLogoutUrl } from '@/lib/auth/auth0Client';

export function Navbar() {
  const { user, isLoading, isAuthenticated } = useAuth0User();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AliExpress Clone
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-gray-900">
              Products
            </Link>

            {isAuthenticated && (
              <>
                <Link href="/buyer/cart" className="text-gray-700 hover:text-gray-900">
                  Cart
                </Link>
                <Link href="/buyer/orders" className="text-gray-700 hover:text-gray-900">
                  Orders
                </Link>
              </>
            )}
          </div>

          {/* Auth UI */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="text-gray-600">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <Link href="/profile" className="flex items-center space-x-2">
                  {user?.picture && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt={user?.name || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-gray-700">{user?.name || 'Profile'}</span>
                </Link>
                <a href={getLogoutUrl()} className="text-gray-700 hover:text-gray-900">
                  Logout
                </a>
              </>
            ) : (
              <>
                <a href={getLoginUrl()} className="text-gray-700 hover:text-gray-900">
                  Sign In
                </a>
                <a href={getLoginUrl('?screen_hint=signup')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
