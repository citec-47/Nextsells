import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/verify/identity
 * Buyer identity verification
 * Stores government ID document for buyers
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.role !== 'BUYER') {
      return errorResponse('This endpoint is for buyers only', 400);
    }

    // Parse request body
    const body = await request.json();
    const { documentType, documentNumber, expiryDate, documentUrl } = body;

    // Validate inputs
    if (!documentType || !['PASSPORT', 'NATIONAL_ID'].includes(documentType)) {
      return errorResponse(
        'Valid document type is required (PASSPORT, NATIONAL_ID)',
        400
      );
    }

    if (!documentNumber || documentNumber.trim().length === 0) {
      return errorResponse('Document number is required', 400);
    }

    if (!documentUrl) {
      return errorResponse('Document URL is required', 400);
    }

    // Create buyer identity document
    const buyerDocument = await prisma.sellerDocument.create({
      data: {
        sellerId: user.id, // For buyers, we use userId in sellerId field temporarily
        documentType: documentType as 'PASSPORT' | 'NATIONAL_ID',
        documentNumber: documentNumber.trim(),
        documentUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'APPROVED', // Buyers' documents are auto-approved
        verifiedAt: new Date(),
      },
    });

    // Mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return successResponse(
      {
        message: 'Identity verified successfully!',
        details: {
          userId: user.id,
          documentId: buyerDocument.id,
          status: 'VERIFIED',
        },
      },
      '200'
    );
  } catch (error) {
    console.error('Identity verification error:', error);
    return errorResponse('Failed to verify identity', 500);
  }
}
