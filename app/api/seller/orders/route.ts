import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

type SellerOrderBucket = {
  orderId: string;
  orderNumber: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: Date;
  totalAmount: number;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    subtotal: number;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'SELLER') {
      return NextResponse.json({ success: false, error: 'Seller access required' }, { status: 403 });
    }

    const sellerResult = await query(
      `SELECT sp.id AS "sellerProfileId", sp.user_id AS "sellerUserId"
       FROM seller_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE u.id = $1
       LIMIT 1`,
      [payload.userId]
    );

    const seller = sellerResult.rows[0] as { sellerProfileId?: string; sellerUserId?: string } | undefined;
    if (!seller) {
      return errorResponse('Seller profile not found', 404);
    }

    const orderNumberColumn = await query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_name = 'orders' AND column_name = 'order_number'
       LIMIT 1`
    );
    const hasOrderNumber = orderNumberColumn.rows.length > 0;

    const rowsResult = await query(
      `SELECT
         o.id AS "orderId",
         ${hasOrderNumber ? `COALESCE(o.order_number, CONCAT('MH-', REPLACE(o.id, '-', '')))` : `CONCAT('MH-', REPLACE(o.id, '-', ''))`} AS "orderNumber",
         COALESCE(o.status, 'PENDING') AS "status",
         COALESCE(u.name, 'Buyer') AS "buyerName",
         COALESCE(u.email, '') AS "buyerEmail",
         o.created_at AS "createdAt",
         COALESCE(o.total_price, 0)::numeric AS "totalAmount",
         p.id AS "productId",
         COALESCE(p.name, 'Product') AS "title",
         COALESCE(o.quantity, 1)::int AS "quantity",
         COALESCE(o.total_price, 0)::numeric AS "subtotal"
       FROM orders o
       JOIN products p ON p.id = o.product_id
       JOIN users u ON u.id = o.buyer_id
       WHERE p.seller_id = $1
       ORDER BY o.created_at DESC`,
      [seller.sellerUserId || payload.userId]
    );

    const orderMap = new Map<string, SellerOrderBucket>();

    for (const row of rowsResult.rows) {
      const key = String(row.orderId);
      const existing = orderMap.get(key);

      if (!existing) {
        orderMap.set(key, {
          orderId: String(row.orderId),
          orderNumber: String(row.orderNumber),
          status: String(row.status),
          buyerName: String(row.buyerName),
          buyerEmail: String(row.buyerEmail),
          createdAt: new Date(row.createdAt),
          totalAmount: Number(row.totalAmount) || 0,
          items: [
            {
              productId: String(row.productId),
              title: String(row.title),
              quantity: Number(row.quantity) || 1,
              subtotal: Number(row.subtotal) || 0,
            },
          ],
        });
      } else {
        existing.totalAmount += Number(row.subtotal) || 0;
        existing.items.push({
          productId: String(row.productId),
          title: String(row.title),
          quantity: Number(row.quantity) || 1,
          subtotal: Number(row.subtotal) || 0,
        });
      }
    }

    return successResponse({
      orders: Array.from(orderMap.values()),
    });
  } catch (error) {
    console.error('Seller orders fetch error:', error);
    return successResponse({
      orders: [],
      fallback: true,
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerResult = await query(
      `SELECT sp.id AS "sellerProfileId", sp.user_id AS "sellerUserId"
       FROM seller_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE u.id = $1
       LIMIT 1`,
      [payload.userId]
    );

    const seller = sellerResult.rows[0] as { sellerProfileId?: string; sellerUserId?: string } | undefined;
    if (!seller) {
      return errorResponse('Seller profile not found', 404);
    }

    const body = await request.json() as { orderId?: string; status?: string };
    const orderId = String(body.orderId || '').trim();
    const nextStatus = String(body.status || '').trim().toUpperCase();

    if (!orderId || !nextStatus) {
      return errorResponse('Order ID and status are required', 422);
    }

    const allowedStatuses = new Set(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED']);
    if (!allowedStatuses.has(nextStatus)) {
      return errorResponse('Invalid order status', 422);
    }

    const ownershipCheck = await query(
      `SELECT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.id = $1 AND p.seller_id = $2
       LIMIT 1`,
      [orderId, seller.sellerProfileId]
    );

    if (ownershipCheck.rows.length === 0) {
      return errorResponse('Order not found for this seller', 404);
    }

    await query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [nextStatus, orderId]
    );

    return successResponse({ orderId, status: nextStatus }, 'Order status updated');
  } catch (error) {
    console.error('Seller order status update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
