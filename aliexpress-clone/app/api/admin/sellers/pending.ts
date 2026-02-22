'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * GET /api/admin/sellers/pending
 * Get all pending seller approval requests
 */
export async function GET(request: NextRequest) {
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

    // Fetch pending requests
    const requests = await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        seller: {
          select: {
            id: true,
            companyName: true,
            businessAddress: true,
            city: true,
            state: true,
            status: true,
          },
        },
        _count: {
          select: { seller: true },
        },
      },
    });

    // Fetch documents for each request
    const requestsWithDocs = await Promise.all(
      requests.map(async (req) => ({
        ...req,
        documents: await prisma.sellerDocument.findMany({
          where: { sellerId: req.sellerId },
          select: {
            id: true,
            documentType: true,
            documentUrl: true,
            status: true,
          },
        }),
      }))
    );

    return successResponse(requestsWithDocs);
  } catch (error) {
    console.error('Fetch requests error:', error);
    return errorResponse('Internal server error', 500);
  }
}
