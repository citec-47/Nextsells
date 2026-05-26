import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

/**
 * Require authentication for a route
 * Redirects to login if user is not authenticated
 * Reads the JWT from the HttpOnly cookie set at login
 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nextsells_token')?.value;

  if (!token) {
    console.warn('[AUTH] No session cookie found, redirecting to login');
    redirect('/auth/login');
  }

  const payload = verifyToken(token);

  if (!payload) {
    console.warn('[AUTH] Invalid or expired token, redirecting to login');
    redirect('/auth/login');
  }

  console.log('[AUTH] Session verified for user:', payload.email);
  // Return a session-like object consistent with what requireRole expects
  return { user: { email: payload.email, id: payload.userId, role: payload.role, roles: [payload.role.toLowerCase()] } };
}

/**
 * Require specific role(s) for a route
 * Redirects to /unauthorized if user lacks the required role
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const userRole = session.user.role.toLowerCase();

  const hasRole = allowedRoles.some((role) => role.toLowerCase() === userRole);

  if (!hasRole) {
    console.warn(
      `[AUTH] User ${session.user.email} lacks required role. Has: ${userRole}, Required: [${allowedRoles.join(', ')}]`
    );
    redirect('/unauthorized');
  }

  console.log(`[AUTH] Role check passed for user ${session.user.email}`);
  return session;
}

/**
 * Get current authenticated user
 * Returns null if no session cookie exists or token is invalid
 */
export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nextsells_token')?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    return { id: payload.userId, email: payload.email, role: payload.role };
  } catch (error) {
    console.error('[AUTH] Error getting user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated without redirecting
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nextsells_token')?.value;
    if (!token) return false;
    return verifyToken(token) !== null;
  } catch (error) {
    console.error('[AUTH] Error checking authentication:', error);
    return false;
  }
}
