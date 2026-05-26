import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

// Ensure loans table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS loans (
      id              VARCHAR(255) PRIMARY KEY,
      seller_id       VARCHAR(255) NOT NULL,
      amount          DECIMAL(10,2) NOT NULL,
      repaid_amount   DECIMAL(10,2) DEFAULT 0,
      purpose         TEXT,
      status          VARCHAR(50) NOT NULL DEFAULT 'pending',
      interest_rate   DECIMAL(5,2) DEFAULT 0,
      duration_months INT DEFAULT 12,
      requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at     TIMESTAMP,
      repaid_at       TIMESTAMP,
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

    const [totalRes, pendingRes, approvedRes, rejectedRes, loanedRes, repaidRes, outstandingRes, listRes] = await Promise.all([
      query('SELECT COUNT(*) FROM loans'),
      query("SELECT COUNT(*) FROM loans WHERE status = 'pending'"),
      query("SELECT COUNT(*) FROM loans WHERE status IN ('approved','active')"),
      query("SELECT COUNT(*) FROM loans WHERE status = 'rejected'"),
      query("SELECT COALESCE(SUM(amount),0) AS total FROM loans WHERE status IN ('approved','active')"),
      query("SELECT COALESCE(SUM(repaid_amount),0) AS total FROM loans WHERE status = 'repaid'"),
      query("SELECT COALESCE(SUM(amount - COALESCE(repaid_amount,0)),0) AS total FROM loans WHERE status IN ('approved','active')"),
      query(`
        SELECT
          l.id             AS "loanId",
          l.amount,
          l.repaid_amount  AS "repaidAmount",
          l.purpose,
          l.status,
          l.interest_rate  AS "interestRate",
          l.duration_months AS "durationMonths",
          l.requested_at   AS "requestedAt",
          l.approved_at    AS "approvedAt",
          l.repaid_at      AS "repaidAt",
          u.id             AS "sellerId",
          u.name           AS "sellerName",
          u.email          AS "sellerEmail",
          sp.company_name  AS "storeName",
          sp.logo_url      AS "storeLogo"
        FROM loans l
        JOIN users u ON l.seller_id = u.id
        LEFT JOIN seller_profiles sp ON sp.user_id = u.id
        ORDER BY l.requested_at DESC
      `),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: parseInt(totalRes.rows[0].count),
        pending: parseInt(pendingRes.rows[0].count),
        active: parseInt(approvedRes.rows[0].count),
        rejected: parseInt(rejectedRes.rows[0].count),
        loanedOut: parseFloat(loanedRes.rows[0].total),
        totalRepaid: parseFloat(repaidRes.rows[0].total),
        outstanding: parseFloat(outstandingRes.rows[0].total),
      },
      data: listRes.rows,
    });
  } catch (error) {
    console.error('Admin loans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
