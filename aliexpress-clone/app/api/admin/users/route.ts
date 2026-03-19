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

    return NextResponse.json({
      success: true,
      stats: statsRes.rows[0],
      data: usersRes.rows,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
