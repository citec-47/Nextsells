import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

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
    const profileResult = await query(
      'SELECT * FROM seller_profiles WHERE user_id = $1',
      [payload.userId]
    );
    const sellerProfile = profileResult.rows[0];

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    // Parse JSON body (document already uploaded via /api/upload/documents)
    const body = await request.json();
    const { documentType, documentNumber, expiryDate, documentUrl, documentPublicId } = body;

    if (!documentUrl) {
      return errorResponse('Document upload is required', 400);
    }

    if (!documentType || !['PASSPORT', 'NATIONAL_ID', 'BUSINESS_LICENSE', 'TAX_ID'].includes(documentType)) {
      return errorResponse(
        'Valid document type is required (PASSPORT, NATIONAL_ID, BUSINESS_LICENSE, TAX_ID)',
        400
      );
    }

    if (!documentNumber || documentNumber.trim().length === 0) {
      return errorResponse('Document number is required', 400);
    }

    // Update seller profile to PENDING_REVIEW
    await query(
      'UPDATE seller_profiles SET onboarding_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['PENDING_REVIEW', sellerProfile.id]
    );

    // Create seller document record
    const docId = randomUUID();
    await query(
      `INSERT INTO seller_documents (id, seller_id, document_type, document_url, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [docId, sellerProfile.id, documentType, documentUrl, 'PENDING']
    );

    // Create approval request (skip if one already exists for this seller)
    const existingReq = await query(
      'SELECT id FROM approval_requests WHERE seller_id = $1',
      [sellerProfile.id]
    );
    if (existingReq.rows.length === 0) {
      const reqId = randomUUID();
      await query(
        `INSERT INTO approval_requests (id, seller_id, status) VALUES ($1, $2, $3)`,
        [reqId, sellerProfile.id, 'PENDING']
      );
    }

    // Get admin users to notify
    const adminResult = await query(
      "SELECT id, email FROM users WHERE role = 'ADMIN'",
      []
    );
    const admins = adminResult.rows;

    return successResponse(
      {
        message:
          'Document uploaded successfully. Your account is now pending admin verification.',
        details: {
          sellerId: sellerProfile.id,
          documentId: docId,
          status: 'PENDING_REVIEW',
          documentType,
        },
        currentStep: 3,
        nextStep: 4,
        approvalPending: true,
        adminNotified: admins.length > 0,
      },
      'Document uploaded successfully'
    );
  } catch (error) {
    console.error('Step 3 error:', error);
    return errorResponse('Failed to process document upload', 500);
  }
}


