import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

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

    if (!governmentIdType || !['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'BUSINESS_LICENSE', 'TAX_ID'].includes(governmentIdType)) {
      return errorResponse(
        'Valid government ID type is required',
        400
      );
    }

    // Check if document already exists for this seller
    const existingDocResult = await query(
      'SELECT * FROM seller_documents WHERE seller_id = $1 LIMIT 1',
      [sellerProfile.id]
    );
    const existingDoc = existingDocResult.rows[0];

    if (existingDoc) {
      // Update existing document
      await query(
        `UPDATE seller_documents 
         SET document_type = $1, document_url = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [governmentIdType, governmentIdUrl, existingDoc.id]
      );
    } else {
      // Create new document
      const docId = randomUUID();
      await query(
        `INSERT INTO seller_documents (id, seller_id, document_type, document_url, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [docId, sellerProfile.id, governmentIdType, governmentIdUrl, 'PENDING']
      );
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
