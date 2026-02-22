'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { validateRequired, validationError, errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    const requiredErrors = validateRequired(body, ['email', 'password']);
    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401, 'Login failed');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401, 'Login failed');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return errorResponse('Your account has been blocked', 403, 'Access denied');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
