import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

/**
 * POST /api/seller/register/step-2
 * Step 2: Upload logo
 */
export async function POST(request: NextRequest) {
  console.log('[Step-2] Route accessed');
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    console.log('[Step-2] Token extracted:', !!token);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    console.log('[Step-2] Token verified:', !!payload);
    if (!payload) {
      console.log('[Step-2] Invalid token, returning 401');
      return errorResponse('Invalid token', 401);
    }

    // Get seller profile
    const result = await query(
      'SELECT * FROM seller_profiles WHERE user_id = $1',
      [payload.userId]
    );
    const sellerProfile = result.rows[0];
    console.log('[Step-2] Seller profile found:', !!sellerProfile);

    if (!sellerProfile) {
      console.log('[Step-2] No seller profile, returning 404');
      return errorResponse('Seller profile not found', 404);
    }

    console.log('[Step-2] Seller status:', sellerProfile.onboarding_status);
    if (sellerProfile.onboarding_status !== 'IN_PROGRESS') {
      console.log('[Step-2] Invalid status, returning 400');
      return errorResponse(
        'Seller onboarding is not in progress',
        400,
        'Invalid status'
      );
    }

    // Parse JSON data (logo already uploaded via frontend)
    const body = await request.json();
    console.log('[Step-2] Body received:', JSON.stringify(body));
    const { logoUrl, companyName, businessType, website, bio } = body;

    // Validate logo URL
    if (!logoUrl) {
      console.log('[Step-2] No logo URL, returning 400');
      return errorResponse('Logo URL is required', 400);
    }

    // Validate company name
    if (!companyName || companyName.trim().length === 0) {
      console.log('[Step-2] No company name, returning 400');
      return errorResponse('Company name is required', 400);
    }

    console.log('[Step-2] Updating seller profile...');
    // Update seller profile with logo and business info
    await query(
      `UPDATE seller_profiles 
       SET company_name = $1, logo_url = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [companyName.trim(), logoUrl, sellerProfile.id]
    );

    console.log('[Step-2] Profile updated, returning success');
    return successResponse(
      {
        message: 'Logo uploaded successfully. Please proceed to document verification.',
        sellerprofile: {
          id: sellerProfile.id,
          companyName: companyName.trim(),
          logo: logoUrl,
        },
        currentStep: 2,
        nextStep: 3,
      },
      'Logo uploaded successfully. Please proceed to document verification.',
      200
    );
  } catch (error) {
    console.error('Step 2 error:', error);
    return errorResponse('Failed to process logo upload', 500);
  }
}
