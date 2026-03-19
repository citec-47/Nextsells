import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

async function ensureAnalyticsSchema() {
  await query(`
    ALTER TABLE seller_profiles
    ADD COLUMN IF NOT EXISTS store_visitors INTEGER NOT NULL DEFAULT 0
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id           VARCHAR(255) PRIMARY KEY,
      seller_id    VARCHAR(255) NOT NULL,
      amount       DECIMAL(10,2) NOT NULL,
      status       VARCHAR(50) NOT NULL DEFAULT 'pending',
      bank_account VARCHAR(255),
      notes        TEXT,
      requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at  TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )
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
    await ensureAnalyticsSchema();

    const [overviewRes, trendRes, statusRes, topSellersRes] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM orders) AS "totalOrders",
          (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders WHERE status IN ('DELIVERED', 'PAID')) AS "totalRevenue",
          (SELECT COALESCE(SUM(store_visitors), 0)::int FROM seller_profiles) AS "totalVisitors",
          (SELECT COUNT(*)::int FROM seller_profiles) AS "activeStores",
          (SELECT COALESCE(SUM(amount), 0)::float FROM withdrawals WHERE status = 'pending') AS "pendingPayouts"
      `),
      query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - interval '5 months',
            date_trunc('month', CURRENT_DATE),
            interval '1 month'
          ) AS month_start
        ),
        monthly_orders AS (
          SELECT
            date_trunc('month', created_at) AS month_start,
            COUNT(*)::int AS order_count,
            COALESCE(SUM(total_amount), 0)::float AS revenue
          FROM orders
          WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '5 months'
          GROUP BY 1
        )
        SELECT
          to_char(months.month_start, 'Mon') AS month,
          COALESCE(monthly_orders.order_count, 0) AS "orderCount",
          COALESCE(monthly_orders.revenue, 0)::float AS revenue
        FROM months
        LEFT JOIN monthly_orders ON monthly_orders.month_start = months.month_start
        ORDER BY months.month_start
      `),
      query(`
        SELECT
          status,
          COUNT(*)::int AS count
        FROM orders
        GROUP BY status
        ORDER BY count DESC, status ASC
      `),
      query(`
        SELECT
          u.id AS "userId",
          COALESCE(NULLIF(sp.company_name, ''), u.name, 'Untitled Store') AS "storeName",
          u.name AS "sellerName",
          sp.logo_url AS "storeLogo",
          COALESCE(sp.store_visitors, 0)::int AS visitors,
          COUNT(DISTINCT o.id)::int AS orders,
          COALESCE(SUM(CASE WHEN o.status IN ('DELIVERED', 'PAID') THEN o.total_amount ELSE 0 END), 0)::float AS revenue
        FROM users u
        JOIN seller_profiles sp ON sp.user_id = u.id
        LEFT JOIN products p ON p.seller_id = u.id
        LEFT JOIN orders o ON o.product_id = p.id
        WHERE u.role = 'SELLER'
        GROUP BY u.id, sp.company_name, u.name, sp.logo_url, sp.store_visitors
        ORDER BY revenue DESC, orders DESC, visitors DESC
        LIMIT 5
      `),
    ]);

    const overview = overviewRes.rows[0];
    const totalVisitors = Number(overview.totalVisitors || 0);
    const totalOrders = Number(overview.totalOrders || 0);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue: Number(overview.totalRevenue || 0),
          totalOrders,
          totalVisitors,
          activeStores: Number(overview.activeStores || 0),
          pendingPayouts: Number(overview.pendingPayouts || 0),
          conversionRate: totalVisitors > 0 ? Number(((totalOrders / totalVisitors) * 100).toFixed(2)) : 0,
        },
        monthlyTrend: trendRes.rows.map((row) => ({
          month: row.month,
          orderCount: Number(row.orderCount || 0),
          revenue: Number(row.revenue || 0),
        })),
        orderStatus: statusRes.rows.map((row) => ({
          status: row.status,
          count: Number(row.count || 0),
        })),
        topStores: topSellersRes.rows.map((row) => ({
          userId: row.userId,
          storeName: row.storeName,
          sellerName: row.sellerName,
          storeLogo: row.storeLogo,
          visitors: Number(row.visitors || 0),
          orders: Number(row.orders || 0),
          revenue: Number(row.revenue || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}