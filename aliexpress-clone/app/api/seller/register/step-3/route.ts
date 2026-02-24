import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { uploadImage } from '@/lib/cloudinary';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/seller/register/step-3
 * Step 3: Upload government ID for verification
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

    // Parse form data
    const formData = await request.formData();
    const documentFile = formData.get('document') as File | null;
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string;
    const expiryDate = formData.get('expiryDate') as string;

    // Validate document upload
    if (!documentFile) {
      return errorResponse('Document file is required', 400);
    }

    if (!documentType || !['PASSPORT', 'NATIONAL_ID'].includes(documentType)) {
      return errorResponse(
        'Valid document type is required (PASSPORT, NATIONAL_ID)',
        400
      );
    }

    if (!documentNumber || documentNumber.trim().length === 0) {
      return errorResponse('Document number is required', 400);
    }

    if (documentFile.size > 5 * 1024 * 1024) {
      return errorResponse('Document file size exceeds 5MB limit', 400);
    }

    // Validate file type (images and PDFs only)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedTypes.includes(documentFile.type)) {
      return errorResponse(
        'Invalid file type. Only images (JPG, PNG, WebP) and PDFs are allowed',
        400
      );
    }

    // Convert file to buffer
    const bytes = await documentFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload document to Cloudinary
    let documentUrl = '';
    try {
      const result = await uploadImage(
        buffer,
        `document-${payload.userId}-${Date.now()}`,
        'documents'
      );
      documentUrl = result.url;
    } catch (err) {
      console.error('Document upload error:', err);
      return errorResponse('Failed to upload document', 500);
    }

    // Update seller profile to PENDING_REVIEW
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        status: 'PENDING_REVIEW',
      },
    });

    // Create seller document record
    const sellerDoc = await prisma.sellerDocument.create({
      data: {
        sellerId: sellerProfile.id,
        documentType: documentType as 'PASSPORT' | 'NATIONAL_ID',
        documentNumber: documentNumber.trim(),
        documentUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'PENDING',
      },
    });

    // Create approval request
    await prisma.approvalRequest.create({
      data: {
        sellerId: sellerProfile.id,
        status: 'PENDING',
      },
    });

    // Get admin users to notify
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    });

    return successResponse(
      {
        message:
          'Document uploaded successfully. Your account is now pending admin verification.',
        details: {
          sellerId: sellerProfile.id,
          documentId: sellerDoc.id,
          status: 'PENDING_REVIEW',
          documentType,
        },
        currentStep: 3,
        nextStep: 4,
        approvalPending: true,
        adminNotified: admins.length > 0,
      },
      '200'
    );
  } catch (error) {
    console.error('Step 3 error:', error);
    return errorResponse('Failed to process document upload', 500);
  }
}
