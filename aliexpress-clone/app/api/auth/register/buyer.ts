import { NextRequest } from 'next/server';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { validateRequired, validationError, errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/register/buyer
 * Register a new buyer account
 * Buyers only need email, password, and phone
 * No verification/admin approval required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Validate required fields
    const requiredErrors = validateRequired(body, ['email', 'password', 'name', 'phone']);
    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationError({ email: ['Invalid email format'] });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return validationError({ phone: ['Invalid phone number format'] });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return validationError({ password: passwordValidation.errors });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse('Email already registered', 400, 'Registration failed');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create buyer user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'BUYER',
        isVerified: true, // Buyers are automatically verified
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: 'BUYER',
    });

    return successResponse(
      {
        message: 'Buyer account created successfully!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
        isVerified: true,
        requiresVerification: false,
      },
      '201'
    );
  } catch (error) {
    console.error('Buyer registration error:', error);
    return errorResponse(
      'Failed to register buyer account',
      500,
      'Registration failed'
    );
  }
}
