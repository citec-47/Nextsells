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
    // Stats
    const [totalRes, needsActionRes, completedRes, revenueRes] = await Promise.all([
      query('SELECT COUNT(*) FROM orders'),
      query("SELECT COUNT(*) FROM orders WHERE status IN ('PAID','PROCESSING')"),
      query("SELECT COUNT(*) FROM orders WHERE status = 'DELIVERED'"),
      query("SELECT COALESCE(SUM(total_amount),0) AS revenue FROM orders WHERE status = 'DELIVERED'"),
    ]);

    // Orders list with buyer + first seller info
    const ordersRes = await query(
      `SELECT
         o.id             AS "orderId",
         o.order_number   AS "orderNumber",
         o.status,
         o.total_amount   AS "totalAmount",
         o.payment_id     AS "paymentId",
         o.created_at     AS "createdAt",
         buyer.name       AS "buyerName",
         buyer.email      AS "buyerEmail",
         -- first seller on this order
         sp.company_name  AS "sellerName",
         sp.logo_url      AS "sellerLogo",
         sp.is_premium    AS "sellerPremium"
       FROM orders o
       JOIN users buyer ON o.buyer_id = buyer.id
       LEFT JOIN LATERAL (
         SELECT sp2.company_name, sp2.logo_url, sp2.is_premium
         FROM order_items oi
         JOIN products p     ON oi.product_id = p.id
         JOIN seller_profiles sp2 ON p.seller_id = sp2.id
         WHERE oi.order_id = o.id
         LIMIT 1
       ) sp ON TRUE
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      stats: {
        total: parseInt(totalRes.rows[0].count),
        needsAction: parseInt(needsActionRes.rows[0].count),
        completed: parseInt(completedRes.rows[0].count),
        revenue: parseFloat(revenueRes.rows[0].revenue),
      },
      data: ordersRes.rows,
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
