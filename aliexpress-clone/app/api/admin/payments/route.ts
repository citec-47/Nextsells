import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [total, pending, paidOut, rejected, list] = await Promise.all([
      prisma.withdrawal.count(),
      prisma.withdrawal.count({ where: { status: 'pending' } }),
      prisma.withdrawal.aggregate({
        where: { status: { in: ['approved', 'completed'] } },
        _sum: { amount: true },
      }),
      prisma.withdrawal.count({ where: { status: 'rejected' } }),
      prisma.withdrawal.findMany({
        orderBy: { requestedAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              sellerProfile: {
                select: {
                  companyName: true,
                  logo: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        paidOut: Number(paidOut._sum.amount || 0),
        rejected,
      },
      data: list.map((row) => ({
        withdrawalId: row.id,
        amount: Number(row.amount),
        status: row.status,
        bankAccount: row.bankAccount,
        notes: row.notes || null,
        requestedAt: row.requestedAt.toISOString(),
        reviewedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
        userId: row.seller.id,
        sellerName: row.seller.name,
        sellerEmail: row.seller.email,
        storeName: row.seller.sellerProfile?.companyName || null,
        storeLogo: row.seller.sellerProfile?.logo || null,
      })),
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
