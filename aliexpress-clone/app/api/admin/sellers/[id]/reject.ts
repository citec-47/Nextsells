import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';

/**
 * POST /api/admin/sellers/[id]/reject
 * Reject a seller application
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication & admin role
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    // Validate reason
    const errors = validateRequired({ reason }, ['reason']);
    if (errors) {
      return validationError(errors);
    }

    // Find and update approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approvalRequest) {
      return errorResponse('Approval request not found', 404);
    }

    // Update status to rejected
    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    // Update seller profile status
    await prisma.sellerProfile.update({
      where: { id: approvalRequest.sellerId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    // Update all documents to rejected
    await prisma.sellerDocument.updateMany({
      where: { sellerId: approvalRequest.sellerId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    return successResponse(
      { id, status: 'REJECTED' },
      'Seller application rejected'
    );
  } catch (error) {
    console.error('Rejection error:', error);
    return errorResponse('Internal server error', 500);
  }
}
