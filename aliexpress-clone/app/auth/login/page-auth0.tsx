/**
 * Auth0 Login Page Component
 * Located at: app/auth/login/page.tsx
 * 
 * This page displays login and signup options using Auth0
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getLoginUrl, getSignupUrl } from '@/lib/auth/auth0Client';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push(getLoginUrl('/dashboard'));
  };

  const handleSignup = () => {
    router.push(getSignupUrl('/dashboard'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to AliExpress Clone
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in or create a new account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </button>

          {/* Signup Button */}
          <button
            onClick={handleSignup}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Account
          </button>

          {/* Demo Links - Optional */}
          <div className="text-center">
            <Link href="/products" className="text-blue-600 hover:text-blue-700 text-sm">
              Continue as Guest →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
