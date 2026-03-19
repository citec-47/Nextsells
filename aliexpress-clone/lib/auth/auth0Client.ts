/**
 * Auth0 Client-side Utilities
 * Use these hooks and utilities in your React components
 */

'use client';

import { useEffect, useState } from 'react';

export const LOCAL_AUTH_TOKEN_KEY = 'token';
export const LOCAL_AUTH_USER_KEY = 'nextsells_user';
export const LOCAL_AUTH_EVENT = 'nextsells-auth-changed';

type LocalSessionUser = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  picture?: string | null;
  role?: string;
  roles?: string[];
  app_metadata?: {
    roles?: string[];
  };
};

function normalizeLocalUser(user: LocalSessionUser | null): LocalSessionUser | null {
  if (!user) {
    return null;
  }

  const derivedRoles = user.roles && user.roles.length > 0
    ? user.roles
    : user.role
      ? [user.role]
      : [];

  return {
    ...user,
    sub: user.sub || user.id,
    roles: derivedRoles,
    app_metadata: {
      ...(user.app_metadata || {}),
      roles: derivedRoles,
    },
  };
}

function readLocalSession() {
  if (typeof window === 'undefined') {
    return { token: null, user: null as LocalSessionUser | null };
  }

  const token = window.localStorage.getItem(LOCAL_AUTH_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(LOCAL_AUTH_USER_KEY);

  if (!token || !rawUser) {
    return { token: null, user: null as LocalSessionUser | null };
  }

  try {
    return {
      token,
      user: normalizeLocalUser(JSON.parse(rawUser) as LocalSessionUser),
    };
  } catch (error) {
    console.error('Failed to parse local auth session:', error);
    window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    return { token, user: null as LocalSessionUser | null };
  }
}

function notifyLocalAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_AUTH_EVENT));
  }
}

export function persistLocalAuthSession(token: string, user: LocalSessionUser) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(
    LOCAL_AUTH_USER_KEY,
    JSON.stringify(normalizeLocalUser(user))
  );
  notifyLocalAuthChanged();
}

export function clearLocalAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
  window.localStorage.removeItem(LOCAL_AUTH_USER_KEY);
  notifyLocalAuthChanged();
}

export function getLocalAuthSession() {
  return readLocalSession();
}

/**
 * Custom hook to get current user information
 * Usage in components:
 * const { user, isLoading, error } = useAuth0User();
 */
export function useAuth0User() {
  const [localUser, setLocalUser] = useState<LocalSessionUser | null>(null);
  const [isLocalReady, setIsLocalReady] = useState(false);

  useEffect(() => {
    const syncLocalSession = () => {
      const { user: storedUser } = readLocalSession();
      setLocalUser(storedUser);
      setIsLocalReady(true);
    };

    syncLocalSession();
    window.addEventListener('storage', syncLocalSession);
    window.addEventListener(LOCAL_AUTH_EVENT, syncLocalSession);

    return () => {
      window.removeEventListener('storage', syncLocalSession);
      window.removeEventListener(LOCAL_AUTH_EVENT, syncLocalSession);
    };
  }, []);

  const resolvedUser = localUser;
  const resolvedLoading = !isLocalReady;

  return {
    user: resolvedUser,
    isLoading: resolvedLoading,
    error: null,
    isAuthenticated: Boolean(resolvedUser),
  };
}

/**
 * Helper function to get login URL
 */
export function getLoginUrl(returnTo?: string) {
  const params = new URLSearchParams();
  if (returnTo) params.append('returnTo', returnTo);
  const query = params.toString();
  return query ? `/auth/login?${query}` : '/auth/login';
}

/**
 * Helper function to get logout URL
 */
export function getLogoutUrl(returnTo?: string) {
  const params = new URLSearchParams();
  if (returnTo) params.append('returnTo', returnTo);
  const query = params.toString();
  return query ? `/auth/logout?${query}` : '/auth/logout';
}

/**
 * Helper function to get signup URL
 */
export function getSignupUrl(returnTo?: string) {
  const params = new URLSearchParams();
  if (returnTo) params.append('returnTo', returnTo);

  const query = params.toString();
  return query ? `/auth/accounts?${query}` : '/auth/accounts';
}
