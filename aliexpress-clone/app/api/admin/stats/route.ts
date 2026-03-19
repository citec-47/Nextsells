import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [usersRes, sellersRes, buyersRes, pendingRes, ordersRes, revenueRes] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query("SELECT COUNT(*) FROM users WHERE role = 'SELLER'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'BUYER'"),
      query("SELECT COUNT(*) FROM approval_requests WHERE status = 'PENDING'"),
      query('SELECT COUNT(*) FROM orders'),
      query("SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status IN ('DELIVERED', 'PAID')"),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: parseInt(usersRes.rows[0].count),
        totalSellers: parseInt(sellersRes.rows[0].count),
        totalBuyers: parseInt(buyersRes.rows[0].count),
        pendingApprovals: parseInt(pendingRes.rows[0].count),
        totalOrders: parseInt(ordersRes.rows[0].count),
        revenue: parseFloat(revenueRes.rows[0].revenue),
        pendingWithdrawals: 0,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
