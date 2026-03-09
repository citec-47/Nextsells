/**
 * Role-Based Access Control (RBAC) with Auth0
 * Located at: lib/auth/auth0Rbac.ts
 * 
 * Helper functions for implementing role-based access control
 */

import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';
import type { Auth0User } from './auth0Types';

/**
 * Get user roles from Auth0 token
 * 
 * Note: Roles need to be configured in Auth0 Rules/Actions
 * and added as custom claim 'https://aliexpress-clone/roles'
 */
export async function getUserRoles(): Promise<string[]> {
  const session = await getSession();
  
  if (!session) {
    return [];
  }
  
  const user = session.user as Auth0User;
  const roles = user['https://aliexpress-clone/roles'] || [];
  
  return Array.isArray(roles) ? roles : [roles];
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const roles = await getUserRoles();
  return roles.includes(requiredRole);
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(requiredRoles: string[]): Promise<boolean> {
  const roles = await getUserRoles();
  return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if user has all specified roles
 */
export async function hasAllRoles(requiredRoles: string[]): Promise<boolean> {
  const roles = await getUserRoles();
  return requiredRoles.every(role => roles.includes(role));
}

/**
 * Middleware function to protect routes by role
 * 
 * Usage in route handler:
 * export const GET = requireRole('admin')(async (req) => { ... });
 */
export function requireRole(role: string | string[]) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest): Promise<Response> => {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const requiredRoles = Array.isArray(role) ? role : [role];
      const hasRequiredRole = await hasAnyRole(requiredRoles);
      
      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      
      return handler(req);
    };
  };
}

/**
 * Get user type/role from Auth0 (for your app's internal role system)
 * Maps Auth0 roles to your app roles: 'buyer', 'seller', 'admin'
 */
export async function getUserType(): Promise<'buyer' | 'seller' | 'admin' | null> {
  const roles = await getUserRoles();
  
  // Map Auth0 roles to app roles
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('seller')) return 'seller';
  if (roles.includes('buyer')) return 'buyer';
  
  // Default to buyer if no role is set
  return null;
}

/**
 * Check if user is seller
 */
export async function isSeller(): Promise<boolean> {
  const userType = await getUserType();
  return userType === 'seller';
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const userType = await getUserType();
  return userType === 'admin';
}

/**
 * Example: Protected API route for sellers only
 * 
 * Usage:
 * export const POST = requireRole('seller')(async (req: NextRequest) => {
 *   // Only sellers can access this
 *   const data = await req.json();
 *   return NextResponse.json({ success: true });
 * });
 */

/**
 * Example: Protected API route for admins only
 * 
 * Usage:
 * export const DELETE = requireRole('admin')(async (req: NextRequest) => {
 *   // Only admins can access this
 *   return NextResponse.json({ success: true });
 * });
 */

/**
 * Get user permissions (if configured in Auth0)
 */
export async function getUserPermissions(): Promise<string[]> {
  const session = await getSession();
  
  if (!session) {
    return [];
  }
  
  const user = session.user as Auth0User;
  const permissions = user['https://aliexpress-clone/permissions'] || [];
  
  return Array.isArray(permissions) ? permissions : [permissions];
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
}

/**
 * Middleware to check specific permission
 */
export function requirePermission(permission: string | string[]) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest): Promise<Response> => {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const requiredPermissions = Array.isArray(permission)
        ? permission
        : [permission];
      
      const permissions = await getUserPermissions();
      const hasRequired = requiredPermissions.some(p =>
        permissions.includes(p)
      );
      
      if (!hasRequired) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return handler(req);
    };
  };
}

/**
 * Full example of a protected seller API route:
 * 
 * // app/api/seller/products/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { requireRole } from '@/lib/auth/auth0Rbac';
 * 
 * export const POST = requireRole('seller')(async (req: NextRequest) => {
 *   try {
 *     const data = await req.json();
 *     
 *     // Create product in database
 *     const product = await db.product.create({
 *       data: {
 *         ...data,
 *         sellerId: session.user.sub,
 *       },
 *     });
 *     
 *     return NextResponse.json(product);
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Failed to create product' },
 *       { status: 500 }
 *     );
 *   }
 * });
 */
