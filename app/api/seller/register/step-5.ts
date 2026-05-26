import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

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
    const profileResult = await query(
      'SELECT * FROM seller_profiles WHERE user_id = $1',
      [payload.userId]
    );
    const sellerProfile = profileResult.rows[0];

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    if (sellerProfile.onboarding_status !== 'IN_PROGRESS') {
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
    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [payload.userId]
    );
    const user = userResult.rows[0];

    if (!user || !user.email) {
      return errorResponse(
        'User account information is incomplete',
        400
      );
    }

    // Verify seller documents exist
    const docResult = await query(
      'SELECT * FROM seller_documents WHERE seller_id = $1 LIMIT 1',
      [sellerProfile.id]
    );
    const sellerDoc = docResult.rows[0];

    if (!sellerDoc) {
      return errorResponse(
        'Government ID information is required',
        400
      );
    }

    // Update seller profile to PENDING_REVIEW
    await query(
      `UPDATE seller_profiles 
       SET onboarding_status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      ['PENDING_REVIEW', sellerProfile.id]
    );

    // Get updated profile
    const updatedResult = await query(
      'SELECT * FROM seller_profiles WHERE id = $1',
      [sellerProfile.id]
    );
    const updatedProfile = updatedResult.rows[0];

    return successResponse(
      {
        success: true,
        sellerId: updatedProfile.id,
        status: updatedProfile.onboarding_status,
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
