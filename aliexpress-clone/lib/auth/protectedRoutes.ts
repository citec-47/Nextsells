import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { extractRolesFromUser } from '@/lib/auth/roles';

/**
 * Require authentication for a route
 * Redirects to login if user is not authenticated
 * Logs authentication attempts for debugging
 */
export async function requireAuth() {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      console.warn('[AUTH] No session found, redirecting to login');
      redirect('/api/auth/login');
    }

    console.log('[AUTH] Session verified for user:', session.user.email);
    return session;
  } catch (error) {
    console.error('[AUTH] Error checking session:', error);
    redirect('/api/auth/login');
  }
}

/**
 * Check and log all roles for debugging
 * Don't redirect - just log all available roles
 */
export async function checkAndLogRoles(session: any) {
  const { roles, sources, metadataRoles } = extractRolesFromUser(session.user);

  console.log(`[AUTH ROLES] User: ${session.user.email}`);
  console.log(`[AUTH ROLES] Sources: [${sources.join(', ') || 'NONE'}]`);
  console.log(`[AUTH ROLES] Roles: [${roles.join(', ') || 'NONE'}]`);
  if (metadataRoles.length > 0) {
    console.log(`[AUTH ROLES] Metadata roles: [${metadataRoles.join(', ')}]`);
  }
  console.log(
    `[AUTH ROLES] Claims with "role"/"metadata":`,
    Object.keys(session.user).filter((key) => key.includes('role') || key.includes('metadata'))
  );

  return roles;
}

/**
 * Require specific role(s) for a route
 * Redirects to unauthorized page if user lacks required role
 */
export async function requireRole(allowedRoles: string[]) {
  try {
    const session = await requireAuth();
    const userRoles = await checkAndLogRoles(session);

    const hasRole = allowedRoles.some((role) => userRoles.includes(role.toLowerCase()));

    if (!hasRole) {
      console.warn(
        `[AUTH] User ${session.user.email} lacks required role. Has: [${userRoles.join(', ')}], Required: [${allowedRoles.join(', ')}]`
      );
      redirect('/unauthorized');
    }

    console.log(`[AUTH] Role check passed for user ${session.user.email}`);
    return session;
  } catch (error) {
    console.error('[AUTH] Error checking role:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 * Returns null if no session exists
 */
export async function getUser() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) return null;

    return {
      id: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
      roles: extractRolesFromUser(session.user).roles,
    };
  } catch (error) {
    console.error('[AUTH] Error getting user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await auth0.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('[AUTH] Error checking authentication:', error);
    return false;
  }
}
