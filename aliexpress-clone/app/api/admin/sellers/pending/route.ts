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
         ar.id        AS "requestId",
         ar.status,
         ar.created_at AS "createdAt",
         sp.id        AS "sellerId",
         sp.company_name AS "companyName",
         u.name       AS "userName",
         u.email      AS "userEmail"
       FROM approval_requests ar
       JOIN seller_profiles sp ON ar.seller_id = sp.id
       JOIN users u ON sp.user_id = u.id
       WHERE ar.status = 'PENDING'
       ORDER BY ar.created_at DESC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Pending sellers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
