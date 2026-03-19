'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth0User } from '@/lib/auth/auth0Client';

/**
 * Client-side authentication state monitor
 * Tracks auth state changes and logs for debugging
 */
export function AuthStateMonitor() {
  const { user, error, isLoading, isAuthenticated } = useAuth0User();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Log authentication state changes
    if (!isLoading) {
      if (user) {
        console.log('[AUTH STATE] User authenticated:', {
          email: user.email,
          name: user.name,
          pathname,
        });
      } else {
        console.log('[AUTH STATE] No user session');
      }
    }

    if (error) {
      console.error('[AUTH STATE] Authentication error:', error);
    }
  }, [user, error, isLoading, pathname]);

  // Handle session expiration
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      const protectedRoutes = [
        '/admin',
        '/seller',
        '/buyer/wishlist',
        '/buyer/cart',
        '/buyer/checkout',
        '/profile',
      ];

      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute) {
        console.warn('[AUTH STATE] Session expired on protected route, redirecting to login');
        router.push('/auth/login');
      }
    }
  }, [isLoading, isAuthenticated, error, pathname, router]);

  return null; // This is a utility component, renders nothing
}
