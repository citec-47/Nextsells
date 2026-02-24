'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, Truck, Sparkles, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      if (email.trim()) {
        params.set('login_hint', email.trim());
      }
      params.set('returnTo', '/');
      window.location.href = `/api/auth0/login?${params.toString()}`;
    } catch (error) {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-8 h-64 w-64 rounded-full bg-white/10" />
          <div className="relative flex h-full flex-col justify-between px-8 py-10 sm:px-12">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <Store className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-2xl font-bold">
                Market<span className="text-amber-400">Hub</span>
              </span>
            </Link>

            <div className="max-w-md">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                Welcome back to the marketplace
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-200">
                Sign in to track your orders, manage your wishlist, and discover
                personalized deals.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-400/15 p-3">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Millions of Products</p>
                  <p className="text-xs text-slate-300">
                    Shop from verified sellers worldwide
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-400/15 p-3">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Buyer Protection</p>
                  <p className="text-xs text-slate-300">
                    100% money-back guarantee on all orders
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-400/15 p-3">
                  <Truck className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Fast Delivery</p>
                  <p className="text-xs text-slate-300">
                    Express shipping to 190+ countries
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">© 2026 MarketHub. All rights reserved.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/accounts" className="text-blue-600 font-semibold hover:underline">
                    Create one free
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-base font-semibold text-gray-900">Welcome back</p>
              <p className="text-sm text-gray-500">Sign in to your MarketHub account</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email address</span>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-blue-600">
                  <Mail className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password</span>
                  <Link href="/auth/accounts" className="text-xs font-semibold text-amber-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 focus-within:border-blue-600">
                  <Lock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {errorMessage && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 text-center text-sm">
              <span className="text-gray-500">Don&apos;t have an account? </span>
              <Link href="/auth/accounts" className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              By signing in you agree to our{' '}
              <span className="text-gray-500 hover:underline">Terms</span> &amp;{' '}
              <span className="text-gray-500 hover:underline">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
