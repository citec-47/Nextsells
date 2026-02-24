import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/seller/register/step-4
 * Step 4: Save government ID and document information
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
    const {
      governmentIdUrl,
      governmentIdPublicId,
      governmentIdType,
      governmentIdNumber,
      governmentIdExpiration,
      taxDocumentUrl,
      taxDocumentPublicId,
    } = body;

    // Validate required fields
    if (!governmentIdUrl || !governmentIdNumber) {
      return errorResponse('Government ID URL and number are required', 400);
    }

    if (!governmentIdType || !['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'].includes(governmentIdType)) {
      return errorResponse(
        'Valid government ID type is required',
        400
      );
    }

    // Create or update seller document record
    const existingDoc = await prisma.sellerDocument.findFirst({
      where: { sellerId: sellerProfile.id },
    });

    if (existingDoc) {
      await prisma.sellerDocument.update({
        where: { id: existingDoc.id },
        data: {
          documentType: governmentIdType,
          documentNumber: governmentIdNumber,
          expiryDate: governmentIdExpiration ? new Date(governmentIdExpiration) : null,
          documentUrl: governmentIdUrl,
          documentPublicId: governmentIdPublicId,
          taxDocumentUrl: taxDocumentUrl || null,
          taxDocumentPublicId: taxDocumentPublicId || null,
        },
      });
    } else {
      await prisma.sellerDocument.create({
        data: {
          sellerId: sellerProfile.id,
          documentType: governmentIdType,
          documentNumber: governmentIdNumber,
          expiryDate: governmentIdExpiration ? new Date(governmentIdExpiration) : null,
          documentUrl: governmentIdUrl,
          documentPublicId: governmentIdPublicId,
          taxDocumentUrl: taxDocumentUrl || null,
          taxDocumentPublicId: taxDocumentPublicId || null,
        },
      });
    }

    return successResponse(
      { success: true },
      'Document information saved successfully'
    );
  } catch (error) {
    console.error('Step 4 error:', error);
    return errorResponse(
      'Failed to save document information',
      500
    );
  }
}
