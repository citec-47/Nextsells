import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validationError } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/seller-approvals/[id]/reject
 * Admin: Reject a seller account with reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;
    const body = await request.json();
    const { reason } = body;

    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return errorResponse('Access denied. Admin only.', 403);
    }

    // Validate rejection reason
    if (!reason || reason.trim().length < 10) {
      return validationError({
        reason: ['Rejection reason must be at least 10 characters'],
      });
    }

    // Get approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!approvalRequest) {
      return errorResponse('Approval request not found', 404);
    }

    if (approvalRequest.status !== 'PENDING') {
      return errorResponse(
        `Approval request is already ${approvalRequest.status.toLowerCase()}`,
        400
      );
    }

    // Reject all documents
    await prisma.sellerDocument.updateMany(
      {
        sellerId: approvalRequest.sellerId,
        status: 'PENDING',
      },
      {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
      }
    );

    // Update approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        notes: reason.trim(),
        approvedBy: admin.id,
        rejectedAt: new Date(),
      },
    });

    // Update seller profile
    const updatedSeller = await prisma.sellerProfile.update({
      where: { id: approvalRequest.sellerId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
      },
    });

    return successResponse(
      {
        message: 'Seller account rejected successfully',
        approval: {
          id: updatedApproval.id,
          status: updatedApproval.status,
          seller: {
            id: updatedSeller.id,
            companyName: updatedSeller.companyName,
            user: {
              id: approvalRequest.seller.user.id,
              email: approvalRequest.seller.user.email,
              name: approvalRequest.seller.user.name,
            },
          },
          rejectionReason: reason.trim(),
          rejectedAt: updatedApproval.rejectedAt,
          rejectedBy: admin.email,
        },
      },
      '200'
    );
  } catch (error) {
    console.error('Error rejecting seller:', error);
    return errorResponse('Failed to reject seller account', 500);
  }
}
