'use client';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { validateRequired, validationError, errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user (buyer, seller, or admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role = 'BUYER' } = body;

    // Validate required fields
    const requiredErrors = validateRequired(body, ['email', 'password', 'name']);
    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return validationError({ email: ['Invalid email format'] });
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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role.toUpperCase() || 'BUYER',
      },
    });

    // If seller, create seller profile
    if (role.toUpperCase() === 'SELLER') {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          companyName: '',
          businessAddress: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      });
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
        },
        token,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
}
