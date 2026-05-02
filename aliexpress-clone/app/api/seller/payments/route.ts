import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

type SellerPaymentRequest = {
  amount?: number;
  bankAccount?: string;
  notes?: string;
  orderIds?: string[];
};

const prisma = new PrismaClient();

async function computeSellerRevenue(sellerProfileId: string | null) {
  if (!sellerProfileId) return 0;
  const items = await prisma.orderItem.findMany({
    where: {
      product: { sellerId: sellerProfileId },
      order: { status: { in: ['PAID', 'DELIVERED', 'COMPLETED'] } },
    },
    select: { subtotal: true },
  });
  return items.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);
}

export async function GET(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token) || decodeToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    const [revenue, withdrawals] = await Promise.all([
      computeSellerRevenue(sellerProfile?.id || null),
      prisma.withdrawal.findMany({
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
      }),
    ]);

    const paidOut = withdrawals.reduce((sum, row) => (
      row.status === 'approved' || row.status === 'completed' ? sum + Number(row.amount) : sum
    ), 0);

    const pendingPayout = withdrawals.reduce((sum, row) => (
      row.status === 'pending' ? sum + Number(row.amount) : sum
    ), 0);

    return successResponse({
      stats: {
        totalRevenue: revenue,
        paidOut,
        pendingPayout,
        availableBalance: Math.max(revenue - paidOut - pendingPayout, 0),
      },
      withdrawals: withdrawals.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        status: row.status,
        bankAccount: row.bankAccount,
        requestedAt: row.requestedAt.toISOString(),
        approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error('Seller payments fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token) || decodeToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }
    const body = (await request.json()) as SellerPaymentRequest;
    const amount = Number(body.amount || 0);
    const bankAccount = String(body.bankAccount || '').trim();
    const notes = String(body.notes || '').trim();
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];

    if (!Number.isFinite(amount) || amount <= 0) {
      return errorResponse('A valid payment amount is required', 422);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    const totalRevenue = await computeSellerRevenue(sellerProfile?.id || null);

    const withdrawals = await prisma.withdrawal.findMany({
      where: { sellerId: payload.userId },
      select: { amount: true, status: true },
    });

    const paid = withdrawals.reduce((sum, row) => (
      row.status === 'approved' || row.status === 'completed' ? sum + Number(row.amount) : sum
    ), 0);

    const pending = withdrawals.reduce((sum, row) => (
      row.status === 'pending' ? sum + Number(row.amount) : sum
    ), 0);
    const availableBalance = Math.max(totalRevenue - paid - pending, 0);

    if (amount > availableBalance) {
      return errorResponse('Amount exceeds available balance', 422);
    }

    const duplicate = withdrawals.find((row) => row.status === 'pending' && Number(row.amount) === amount);
    if (duplicate) {
      return errorResponse('A similar payment request is already pending', 409);
    }

    const enrichedNotesParts = [notes];
    if (orderIds.length > 0) {
      enrichedNotesParts.push(`order_ids=${orderIds.join(',')}`);
    }

    const enrichedNotes = enrichedNotesParts.filter(Boolean).join(' | ') || null;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        sellerId: payload.userId,
        amount,
        status: 'pending',
        bankAccount: bankAccount || null,
        notes: enrichedNotes,
      },
    });

    return successResponse(
      {
        id: withdrawal.id,
        status: 'pending',
      },
      'Payment request submitted successfully',
      201
    );
  } catch (error) {
    console.error('Seller payment request error:', error);
    return errorResponse('Internal server error', 500);
  }
}
