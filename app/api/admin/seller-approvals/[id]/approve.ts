import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/seller-approvals/[id]/approve
 * Admin: Approve a seller account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params;

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

    // Get approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        seller: {
          include: {
            user: true,
            documents: true,
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

    // Approve all documents
    await prisma.sellerDocument.updateMany(
      {
        sellerId: approvalRequest.sellerId,
        status: 'PENDING',
      },
      {
        status: 'APPROVED',
        verifiedAt: new Date(),
      }
    );

    // Update approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    });

    // Update seller profile status
    const updatedSeller = await prisma.sellerProfile.update({
      where: { id: approvalRequest.sellerId },
      data: {
        status: 'APPROVED',
      },
    });

    // Mark user as verified
    await prisma.user.update({
      where: { id: approvalRequest.seller.userId },
      data: {
        isVerified: true,
      },
    });

    return successResponse(
      {
        message: 'Seller account approved successfully',
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
          approvedAt: updatedApproval.approvedAt,
          approvedBy: admin.email,
        },
      },
      '200'
    );
  } catch (error) {
    console.error('Error approving seller:', error);
    return errorResponse('Failed to approve seller account', 500);
  }
}
