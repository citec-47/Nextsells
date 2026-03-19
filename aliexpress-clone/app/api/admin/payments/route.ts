import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

// Ensure withdrawals table exists (idempotent)
async function ensureTable() {
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

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureTable();

    const [totalRes, pendingRes, paidRes, rejectedRes, listRes] = await Promise.all([
      query('SELECT COUNT(*) FROM withdrawals'),
      query("SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'"),
      query("SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE status IN ('approved','completed')"),
      query("SELECT COUNT(*) FROM withdrawals WHERE status = 'rejected'"),
      query(`
        SELECT
          w.id             AS "withdrawalId",
          w.amount,
          w.status,
          w.bank_account   AS "bankAccount",
          w.notes,
          w.requested_at   AS "requestedAt",
          w.reviewed_at    AS "reviewedAt",
          u.id             AS "userId",
          u.name           AS "sellerName",
          u.email          AS "sellerEmail",
          sp.company_name  AS "storeName",
          sp.logo_url      AS "storeLogo"
        FROM withdrawals w
        JOIN users u ON w.seller_id = u.id
        LEFT JOIN seller_profiles sp ON sp.user_id = u.id
        ORDER BY w.requested_at DESC
      `),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total:    parseInt(totalRes.rows[0].count),
        pending:  parseInt(pendingRes.rows[0].count),
        paidOut:  parseFloat(paidRes.rows[0].total),
        rejected: parseInt(rejectedRes.rows[0].count),
      },
      data: listRes.rows,
    });
  } catch (error) {
    console.error('Admin payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
