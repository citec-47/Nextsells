import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = $2
       LIMIT 1`,
      [tableName, columnName]
    );

    return result.rows.length > 0;
  } catch {
    return false;
  }
}

function fallbackStats(storeName = 'My Store', status = 'APPROVED') {
  return {
    storeName,
    status,
    totalProducts: 0,
    publishedProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    availableBalance: 0,
    storeVisitors: 0,
  };
}

export async function GET(request: NextRequest) {
  const token =
    extractToken(request.headers.get('authorization')) ||
    request.cookies.get('nextsells_token')?.value ||
    null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || String(payload.role).toUpperCase() !== 'SELLER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const hasStoreVisitors = await hasColumn('seller_profiles', 'store_visitors');
    const hasOnboardingStatus = await hasColumn('seller_profiles', 'onboarding_status');

    // Get seller profile info from whichever schema variant is present.
    const profileResult = await query(
      `SELECT
         sp.id                AS "sellerId",
         sp.company_name      AS "storeName",
         ${hasOnboardingStatus ? 'sp.onboarding_status' : `'APPROVED'`} AS "status",
         ${hasStoreVisitors ? 'sp.store_visitors' : '0'}                AS "storeVisitors"
       FROM seller_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    const profile = profileResult.rows[0] || {
      sellerId: payload.userId,
      storeName: 'My Store',
      status: 'APPROVED',
      storeVisitors: 0,
    };
    const sellerKeys = [payload.userId, profile.sellerId].filter(Boolean);

    const [productResult, orderResult] = await Promise.all([
      query(
        `SELECT
           COUNT(*)::int AS "totalProducts",
           COUNT(*)::int AS "publishedProducts"
         FROM products
         WHERE seller_id = ANY($1::text[])`,
        [sellerKeys]
      ).catch(() => ({ rows: [{ totalProducts: 0, publishedProducts: 0 }] })),
      query(
        `SELECT
           COUNT(o.id)::int AS "totalOrders",
           COALESCE(SUM(o.total_price), 0)::numeric AS "totalRevenue"
         FROM orders o
         JOIN products p ON p.id = o.product_id
         WHERE p.seller_id = ANY($1::text[])`,
        [sellerKeys]
      ).catch(() => ({ rows: [{ totalOrders: 0, totalRevenue: 0 }] })),
    ]);

    const productStats = productResult.rows[0] || { totalProducts: 0, publishedProducts: 0 };
    const orderStats = orderResult.rows[0] || { totalOrders: 0, totalRevenue: 0 };
    const totalRevenue = Number.parseFloat(String(orderStats.totalRevenue || 0)) || 0;
    const totalOrders = Number.parseInt(String(orderStats.totalOrders || 0), 10) || 0;
    const publishedProducts = Number.parseInt(String(productStats.publishedProducts || 0), 10) || 0;
    const totalProducts = Number.parseInt(String(productStats.totalProducts || 0), 10) || 0;
    const totalProfit = Number((totalRevenue * 0.2).toFixed(2));
    const availableBalance = Number((totalRevenue * 0.8).toFixed(2));

    return NextResponse.json({
      storeName: profile.storeName || 'My Store',
      status: profile.status || 'PENDING_REVIEW',
      totalProducts,
      publishedProducts,
      totalOrders,
      totalRevenue,
      totalProfit,
      availableBalance,
      storeVisitors: Number.parseInt(String(profile.storeVisitors || 0), 10) || 0,
    });
  } catch (error) {
    console.error('Seller stats error, using fallback data:', error);
    return NextResponse.json(fallbackStats());
  }
}
