import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [statsRes, usersRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE role = 'ADMIN')::int AS admins,
          COUNT(*) FILTER (WHERE role = 'SELLER')::int AS sellers,
          COUNT(*) FILTER (WHERE role = 'BUYER')::int AS buyers,
          COUNT(*) FILTER (WHERE is_blocked = TRUE)::int AS blocked,
          COUNT(*) FILTER (WHERE is_verified = TRUE)::int AS verified
        FROM users
      `),
      query(`
        SELECT
          u.id AS "userId",
          u.name,
          u.email,
          u.role,
          u.is_verified AS "isVerified",
          u.is_blocked AS "isBlocked",
          u.created_at AS "createdAt",
          sp.company_name AS "companyName",
          sp.logo_url AS "logoUrl",
          COUNT(DISTINCT o.id)::int AS "orderCount",
          COUNT(DISTINCT p.id)::int AS "productCount"
        FROM users u
        LEFT JOIN seller_profiles sp ON sp.user_id = u.id
        LEFT JOIN orders o ON o.buyer_id = u.id
        LEFT JOIN products p ON p.seller_id = u.id
        GROUP BY u.id, sp.company_name, sp.logo_url
        ORDER BY u.created_at DESC
      `),
    ]);

    const sqlStats = statsRes.rows[0];
    const sqlUsers = usersRes.rows;
    const sqlTotal = Number(sqlStats?.total ?? 0);

    if (sqlTotal === 0 && sqlUsers.length === 0) {
      const [total, admins, sellers, buyers, blocked, verified, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.user.count({ where: { role: 'SELLER' } }),
        prisma.user.count({ where: { role: 'BUYER' } }),
        prisma.user.count({ where: { isBlocked: true } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.findMany({
          include: {
            _count: { select: { orders: true } },
            sellerProfile: { include: { _count: { select: { products: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        stats: { total, admins, sellers, buyers, blocked, verified },
        data: users.map((user) => ({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isBlocked: user.isBlocked,
          createdAt: user.createdAt,
          companyName: user.sellerProfile?.companyName ?? null,
          logoUrl: user.sellerProfile?.logo ?? null,
          orderCount: user._count.orders,
          productCount: user.sellerProfile?._count.products ?? 0,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      stats: sqlStats,
      data: sqlUsers,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
