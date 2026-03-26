/**
 * Auth0 Server-side Utilities
 * Use these utilities in your API routes and server-side code
 * Located at: lib/auth/auth0Server.ts
 */

import { auth0 } from '@/lib/auth0';

/**
 * Get Auth0 session in server-side code
 * Example usage in API route:
 * 
 * export async function GET(request: NextRequest) {
 *   const session = await getAuth0Session();
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Use session.user to access user info
 * }
 */
export async function getAuth0Session() {
  return auth0.getSession();
}

/**
 * Get user claims from Auth0 token
 */
export async function getAuth0UserId() {
  const session = await auth0.getSession();
  return session?.user.sub;
}

/**
 * Get user email from Auth0
 */
export async function getAuth0UserEmail() {
  const session = await auth0.getSession();
  return session?.user.email;
}

/**
 * Check if user has specific role in Auth0
 * This assumes you've added custom claims/roles to your Auth0 configuration
 */
export async function hasAuth0Role(requiredRole: string): Promise<boolean> {
  const session = await auth0.getSession();
  const roles = ((session?.user as { [key: string]: unknown } | undefined)?.['https://aliexpress-clone/roles'] as string[] | undefined) || [];
  return roles.includes(requiredRole);
}
