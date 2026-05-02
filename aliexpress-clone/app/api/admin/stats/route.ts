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
    const [totalUsers, totalSellers, totalBuyers, pendingApprovals, totalOrders, pendingOrders, completedOrders, shippingOrders, revenueAgg, pendingWithdrawals] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
      prisma.order.count({ where: { status: { in: ['DELIVERED', 'COMPLETED'] } } }),
      prisma.order.count({ where: { status: { in: ['SHIPPED'] } } }),
      prisma.order.aggregate({
        where: { status: { in: ['DELIVERED', 'PAID'] } },
        _sum: { totalAmount: true },
      }),
      prisma.withdrawal.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalBuyers,
        pendingApprovals,
        totalOrders,
        pendingOrders,
        completedOrders,
        shippingOrders,
        revenue: Number(revenueAgg._sum.totalAmount || 0),
        pendingWithdrawals,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
