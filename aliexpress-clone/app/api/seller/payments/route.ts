import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

type WithdrawalRecord = {
  id: string;
  amount: number;
  status: string;
  bankAccount: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
  completedAt: Date | null;
};

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: sellerProfile.id },
        order: { status: { in: ['PAID', 'DELIVERED'] } },
      },
      select: {
        subtotal: true,
      },
    });

    const withdrawals = (await prisma.withdrawal.findMany({
      where: { sellerId: payload.userId },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        bankAccount: true,
        requestedAt: true,
        approvedAt: true,
        completedAt: true,
      },
    })) as WithdrawalRecord[];

    const totalRevenue = deliveredItems.reduce<number>((sum, row) => sum + Number(row.subtotal), 0);
    const paidOut = withdrawals.reduce<number>(
      (sum, row) => (row.status === 'approved' || row.status === 'completed' ? sum + Number(row.amount) : sum),
      0
    );
    const pendingPayout = withdrawals.reduce<number>(
      (sum, row) => (row.status === 'pending' ? sum + Number(row.amount) : sum),
      0
    );

    return successResponse({
      stats: {
        totalRevenue,
        paidOut,
        pendingPayout,
        availableBalance: Math.max(totalRevenue - paidOut, 0),
      },
      withdrawals,
    });
  } catch (error) {
    console.error('Seller payments fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
