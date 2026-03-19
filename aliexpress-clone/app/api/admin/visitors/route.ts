import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

async function ensureVisitorsColumn() {
  await query(`
    ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS store_visitors INTEGER NOT NULL DEFAULT 0
  `);
}

function authorize(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { payload };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    await ensureVisitorsColumn();

    const [storesRes, visitorsRes, listRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM seller_profiles'),
      query('SELECT COALESCE(SUM(store_visitors), 0)::int AS total FROM seller_profiles'),
      query(`
        SELECT
          sp.id AS "sellerProfileId",
          sp.user_id AS "userId",
          COALESCE(NULLIF(sp.company_name, ''), u.name, 'Untitled Store') AS "storeName",
          u.name AS "sellerName",
          u.email AS "sellerEmail",
          sp.logo_url AS "storeLogo",
          sp.store_visitors AS "visitorCount",
          sp.created_at AS "createdAt"
        FROM seller_profiles sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.store_visitors DESC, sp.created_at DESC
      `),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStores: storesRes.rows[0].count,
        totalVisitors: visitorsRes.rows[0].total,
      },
      data: listRes.rows,
    });
  } catch (error) {
    console.error('Admin visitors GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    await ensureVisitorsColumn();

    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const visitorCount = Number(body.visitorCount);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!Number.isInteger(visitorCount) || visitorCount < 0) {
      return NextResponse.json({ error: 'Visitor count must be a non-negative integer' }, { status: 400 });
    }

    const result = await query(
      `
        UPDATE seller_profiles
        SET store_visitors = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING user_id AS "userId", store_visitors AS "visitorCount"
      `,
      [userId, visitorCount],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Admin visitors POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}