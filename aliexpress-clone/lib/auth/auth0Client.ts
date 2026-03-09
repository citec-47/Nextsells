/**
 * Auth0 Client-side Utilities
 * Use these hooks and utilities in your React components
 */

import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * Custom hook to get current user information
 * Usage in components:
 * const { user, isLoading, error } = useAuth0User();
 */
export function useAuth0User() {
  const { user, isLoading, error } = useUser();
  
  return {
    user,
    isLoading,
    error,
    isAuthenticated: user !== undefined,
  };
}

/**
 * Helper function to get login URL
 */
export function getLoginUrl(returnTo?: string) {
  const params = new URLSearchParams();
  if (returnTo) params.append('returnTo', returnTo);
  return `/api/auth/login?${params.toString()}`;
}

/**
 * Helper function to get logout URL
 */
export function getLogoutUrl(returnTo?: string) {
  const params = new URLSearchParams();
  if (returnTo) params.append('returnTo', returnTo);
  return `/api/auth/logout?${params.toString()}`;
}

/**
 * Helper function to get signup URL
 */
export function getSignupUrl(returnTo?: string) {
  const params = new URLSearchParams({
    screen_hint: 'signup',
  });
  if (returnTo) params.append('returnTo', returnTo);
  return `/api/auth/login?${params.toString()}`;
}
