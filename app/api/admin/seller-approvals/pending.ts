import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/seller/register/pending-approvals
 * Admin: Get list of pending seller approvals
 */
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Access denied. Admin only.', 403);
    }

    // Get pending approval requests with seller details
    const pendingRequests = await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        seller: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
              },
            },
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse(
      {
        totalPending: pendingRequests.length,
        approvals: pendingRequests.map((req: any) => ({
          approvalId: req.id,
          sellerId: req.sellerId,
          user: req.seller.user,
          companyName: req.seller.companyName,
          businessType: req.seller.businessType,
          logo: req.seller.logo,
          documents: req.seller.documents,
          submittedAt: req.createdAt,
        })),
      },
      '200'
    );
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return errorResponse('Failed to fetch pending approvals', 500);
  }
}
