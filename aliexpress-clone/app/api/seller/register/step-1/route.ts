import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcryptjs from 'bcryptjs';
import { validatePasswordStrength } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { validateRequired, validationError, errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

/**
 * POST /api/seller/register/step-1
 * Step 1: Register with email, password, and phone
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

    // Check if user already exists
    const existingResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return validationError({ email: ['Email already registered'] });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user and seller profile
    const userId = randomUUID();
    const sellerProfileId = randomUUID();

    // Create user with hashed password
    await query(
      `INSERT INTO users (id, email, password, name, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, email, hashedPassword, name, 'SELLER']
    );

    // Create seller profile with IN_PROGRESS status
    await query(
      `INSERT INTO seller_profiles (id, user_id, company_name, onboarding_status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [sellerProfileId, userId, '', 'IN_PROGRESS']
    );

    // Generate token
    const token = generateToken({
      userId: userId,
      email: email,
      role: 'SELLER',
    });

    // Build response and set HttpOnly cookie so server-side requireAuth() works after redirect
    const res = NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          message: 'Step 1 complete. Please proceed to logo upload.',
          user: {
            id: userId,
            email: email,
            name: name,
            role: 'SELLER',
          },
          sellerProfileId: sellerProfileId,
          token: token,
          currentStep: 1,
          nextStep: 2,
        },
      },
      { status: 200 }
    );

    res.cookies.set('nextsells_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(
      'Failed to register seller account',
      500,
      'Registration failed'
    );
  }
}

