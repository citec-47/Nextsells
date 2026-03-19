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
    const result = await query(
      `SELECT
         sp.id            AS "sellerId",
         sp.company_name  AS "companyName",
         sp.onboarding_status AS "status",
         sp.is_premium    AS "isPremium",
         sp.logo_url      AS "logoUrl",
         sp.created_at    AS "createdAt",
         u.id             AS "userId",
         u.name           AS "userName",
         u.email          AS "userEmail",
         u.is_verified    AS "isVerified",
         u.is_blocked     AS "isBlocked",
         COUNT(DISTINCT p.id)::int AS "productCount"
       FROM seller_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN products p ON p.seller_id = sp.id
       GROUP BY sp.id, u.id
       ORDER BY sp.created_at DESC`
    );
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List sellers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
