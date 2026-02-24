import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

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
      console.log('[Step-2] No token, returning 401');
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    console.log('[Step-2] Token verified:', !!payload);
    if (!payload) {
      console.log('[Step-2] Invalid token, returning 401');
      return errorResponse('Invalid token', 401);
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
    });
    console.log('[Step-2] Seller profile found:', !!sellerProfile);

    if (!sellerProfile) {
      console.log('[Step-2] No seller profile, returning 404');
      return errorResponse('Seller profile not found', 404);
    }

    console.log('[Step-2] Seller status:', sellerProfile.status);
    if (sellerProfile.status !== 'IN_PROGRESS') {
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
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        companyName: companyName.trim(),
        businessType: businessType || 'Not Specified',
        website: website?.trim() || null,
        bio: bio?.trim() || null,
        logo: logoUrl,
      },
    });

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
