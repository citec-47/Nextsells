import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { comparePassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('[AUTH] Login initiated');
    // Let the Auth0 middleware handle the login flow
    const response = await auth0.middleware(req);
    console.log('[AUTH] Login redirect prepared');
    return response;
  } catch (error) {
    console.error('[AUTH ERROR] Login failed:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requiredErrors = validateRequired(body, ['email', 'password']);

    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    const result = await query(
      `SELECT id, email, name, role, password, is_blocked
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !user.password) {
      return errorResponse('Invalid email or password', 401, 'Login failed');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401, 'Login failed');
    }

    if (user.is_blocked) {
      return errorResponse('Your account has been blocked. Contact support.', 403, 'Login failed');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const res = successResponse(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: [String(user.role).toLowerCase()],
        },
      },
      'Login successful'
    );

    // Set HttpOnly cookie so server-side route protection can verify the session
    res.cookies.set('nextsells_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error('[AUTH ERROR] Local login failed:', error);
    return errorResponse('Internal server error', 500);
  }
}

