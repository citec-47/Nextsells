import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  };
}

/**
 * Middleware to authenticate requests
 */
export async function authMiddleware(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));

  if (!token) {
    return createAuthError('No token provided', 401);
  }

  const payload = verifyToken(token);

  if (!payload) {
    return createAuthError('Invalid or expired token', 401);
  }

  // Attach user to request (need to use custom approach with NextRequest)
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-role', payload.role);

  return response;
}

/**
 * Middleware to check if user has specific role
 */
export function roleMiddleware(...allowedRoles: string[]) {
  return (request: NextRequest) => {
    const role = request.headers.get('x-user-role');

    if (!role || !allowedRoles.includes(role)) {
      return createAuthError('Insufficient permissions', 403);
    }

    return NextResponse.next();
  };
}

/**
 * Helper to create auth error response
 */
function createAuthError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
    },
    { status }
  );
}
