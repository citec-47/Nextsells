'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/admin/sellers/[id]/approve
 * Approve a seller application
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

    // Find and update approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approvalRequest) {
      return errorResponse('Approval request not found', 404);
    }

    // Update status to approved
    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: payload.userId,
        approvedAt: new Date(),
      },
    });

    // Update seller profile status
    await prisma.sellerProfile.update({
      where: { id: approvalRequest.sellerId },
      data: { status: 'APPROVED' },
    });

    // Update all documents to approved
    await prisma.sellerDocument.updateMany({
      where: { sellerId: approvalRequest.sellerId },
      data: { status: 'APPROVED', verifiedAt: new Date() },
    });

    return successResponse(
      { id, status: 'APPROVED' },
      'Seller approved successfully'
    );
  } catch (error) {
    console.error('Approval error:', error);
    return errorResponse('Internal server error', 500);
  }
}
