import { NextRequest } from 'next/server';
import { validatePasswordStrength } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { validateRequired, validationError, errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return validationError({ email: ['Email already registered'] });
    }

    // Create user and seller profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: password, // In production, this would be hashed
          name,
          phone,
          role: 'SELLER',
        },
      });

      // Create seller profile with IN_PROGRESS status
      const sellerProfile = await tx.sellerProfile.create({
        data: {
          userId: user.id,
          companyName: '', // Will be updated in step 2
          businessType: 'Not Specified',
          businessAddress: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          status: 'IN_PROGRESS',
        },
      });

      return { user, sellerProfile };
    });

    // Generate token
    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: 'SELLER',
    });

    return successResponse(
      {
        message: 'Step 1 complete. Please proceed to logo upload.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: 'SELLER',
        },
        sellerProfileId: result.sellerProfile.id,
        token: token,
        currentStep: 1,
        nextStep: 2,
      },
      'Registration successful'
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(
      'Failed to register seller account',
      500,
      'Registration failed'
    );
  }
}

