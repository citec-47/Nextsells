import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';

type SellerPaymentRequest = {
  amount?: number;
  bankAccount?: string;
  notes?: string;
  orderIds?: string[];
};

async function ensureWithdrawalsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id           VARCHAR(255) PRIMARY KEY,
      seller_id    VARCHAR(255) NOT NULL,
      amount       DECIMAL(10,2) NOT NULL,
      status       VARCHAR(50)  NOT NULL DEFAULT 'pending',
      bank_account VARCHAR(255),
      notes        TEXT,
      requested_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_at  TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function getSellerContext(userId: string) {
  const sellerRes = await query(
    `SELECT id, user_id, company_name
     FROM seller_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (sellerRes.rows.length === 0) {
    return null;
  }

  const row = sellerRes.rows[0] as { id: string; user_id: string; company_name: string | null };
  return {
    sellerProfileId: row.id,
    sellerUserId: row.user_id,
    companyName: row.company_name || 'My Store',
  };
}

async function computeSellerRevenue(sellerProfileId: string) {
  const result = await query(
    `SELECT COALESCE(SUM(oi.subtotal), 0)::float AS total
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE p.seller_id = $1
       AND o.status IN ('PAID', 'DELIVERED', 'COMPLETED')`,
    [sellerProfileId]
  );

  return Number(result.rows[0]?.total || 0);
}

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
      return errorResponse('Seller access required', 403);
    }

    await ensureWithdrawalsTable();

    const seller = await getSellerContext(payload.userId);
    if (!seller) {
      return errorResponse('Seller profile not found', 404);
    }

    const [revenue, withdrawalsRes] = await Promise.all([
      computeSellerRevenue(seller.sellerProfileId),
      query(
        `SELECT
           id,
           amount::float AS amount,
           status,
           bank_account AS "bankAccount",
           requested_at AS "requestedAt",
           reviewed_at AS "approvedAt",
           CASE WHEN status IN ('approved', 'completed') THEN reviewed_at ELSE NULL END AS "completedAt",
           notes
         FROM withdrawals
         WHERE seller_id = $1
         ORDER BY requested_at DESC`,
        [seller.sellerUserId]
      ),
    ]);

    const withdrawals = withdrawalsRes.rows as Array<{
      id: string;
      amount: number;
      status: string;
      bankAccount: string | null;
      requestedAt: string;
      approvedAt: string | null;
      completedAt: string | null;
      notes?: string | null;
    }>;

    const paidOut = withdrawals.reduce((sum, row) => (
      row.status === 'approved' || row.status === 'completed' ? sum + Number(row.amount) : sum
    ), 0);

    const pendingPayout = withdrawals.reduce((sum, row) => (
      row.status === 'pending' ? sum + Number(row.amount) : sum
    ), 0);

    return successResponse({
      stats: {
        totalRevenue: revenue,
        paidOut,
        pendingPayout,
        availableBalance: Math.max(revenue - paidOut - pendingPayout, 0),
      },
      withdrawals,
    });
  } catch (error) {
    console.error('Seller payments fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
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

    await ensureWithdrawalsTable();

    const seller = await getSellerContext(payload.userId);
    if (!seller) {
      return errorResponse('Seller profile not found', 404);
    }

    const body = (await request.json()) as SellerPaymentRequest;
    const amount = Number(body.amount || 0);
    const bankAccount = String(body.bankAccount || '').trim();
    const notes = String(body.notes || '').trim();
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : [];

    if (!Number.isFinite(amount) || amount <= 0) {
      return errorResponse('A valid payment amount is required', 422);
    }

    const totalRevenue = await computeSellerRevenue(seller.sellerProfileId);

    const withdrawalAggRes = await query(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('approved','completed') THEN amount ELSE 0 END), 0)::float AS paid,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::float AS pending
       FROM withdrawals
       WHERE seller_id = $1`,
      [seller.sellerUserId]
    );

    const paid = Number(withdrawalAggRes.rows[0]?.paid || 0);
    const pending = Number(withdrawalAggRes.rows[0]?.pending || 0);
    const availableBalance = Math.max(totalRevenue - paid - pending, 0);

    if (amount > availableBalance) {
      return errorResponse('Amount exceeds available balance', 422);
    }

    const duplicateRes = await query(
      `SELECT id
       FROM withdrawals
       WHERE seller_id = $1
         AND status = 'pending'
         AND amount = $2
         AND requested_at >= NOW() - INTERVAL '2 minutes'
       LIMIT 1`,
      [seller.sellerUserId, amount]
    );

    if (duplicateRes.rows.length > 0) {
      return errorResponse('A similar payment request is already pending', 409);
    }

    const enrichedNotesParts = [notes];
    if (orderIds.length > 0) {
      enrichedNotesParts.push(`order_ids=${orderIds.join(',')}`);
    }

    const enrichedNotes = enrichedNotesParts.filter(Boolean).join(' | ') || null;

    const withdrawalId = randomUUID();
    await query(
      `INSERT INTO withdrawals (id, seller_id, amount, bank_account, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [withdrawalId, seller.sellerUserId, amount, bankAccount || null, enrichedNotes]
    );

    return successResponse(
      {
        id: withdrawalId,
        status: 'pending',
      },
      'Payment request submitted successfully',
      201
    );
  } catch (error) {
    console.error('Seller payment request error:', error);
    return errorResponse('Internal server error', 500);
  }
}
