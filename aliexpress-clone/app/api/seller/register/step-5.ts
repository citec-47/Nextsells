import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/seller/register/step-5
 * Step 5: Finalize registration and submit for approval
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    if (sellerProfile.status !== 'IN_PROGRESS') {
      return errorResponse(
        'Seller onboarding is not in progress',
        400,
        'Invalid status'
      );
    }

    const body = await request.json();
    const { termsAccepted, privacyAccepted } = body;

    if (!termsAccepted) {
      return errorResponse('Terms and conditions must be accepted', 400);
    }

    // Verify that required information has been provided
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, phone: true },
    });

    if (!user || !user.email || !user.phone) {
      return errorResponse(
        'User account information is incomplete',
        400
      );
    }

    // Verify seller documents exist
    const sellerDoc = await prisma.sellerDocument.findFirst({
      where: { sellerId: sellerProfile.id },
    });

    if (!sellerDoc) {
      return errorResponse(
        'Government ID information is required',
        400
      );
    }

    // Update seller profile to PENDING_REVIEW
    const updatedProfile = await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        status: 'PENDING_REVIEW',
        agreedToTerms: termsAccepted,
        agreedToPrivacy: privacyAccepted,
      },
    });

    return successResponse(
      {
        success: true,
        sellerId: updatedProfile.id,
        status: updatedProfile.status,
      },
      'Registration submitted for review'
    );
  } catch (error) {
    console.error('Step 5 error:', error);
    return errorResponse(
      'Failed to finalize registration',
      500
    );
  }
}
