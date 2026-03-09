/**
 * User Profile / Dashboard Page
 * Located at: app/profile/page.tsx
 * 
 * Protected page showing user information from Auth0
 */

'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';
import { LogoutButton } from '@/app/components/auth/LogoutButton';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth0User();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Not Authenticated</h1>
        <p className="text-gray-600">Please sign in to view your profile</p>
        <Link href="/api/auth/login" className="text-blue-600 hover:text-blue-700">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <LogoutButton className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" />
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Profile Picture */}
            {user?.picture && (
              <div className="flex justify-center">
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="h-24 w-24 rounded-full object-cover"
                />
              </div>
            )}

            {/* User Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-lg text-gray-900">{user?.name || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-lg text-gray-900">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                <p className="mt-1 text-lg text-gray-900">{user?.email_verified ? 'Yes ✓' : 'No'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-600 break-all font-mono">{user?.sub || 'N/A'}</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <Link
                  href="/buyer/dashboard"
                  className="block text-blue-600 hover:text-blue-700 font-medium"
                >
                  → Go to Dashboard
                </Link>
                <Link
                  href="/products"
                  className="block text-blue-600 hover:text-blue-700 font-medium"
                >
                  → Browse Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
