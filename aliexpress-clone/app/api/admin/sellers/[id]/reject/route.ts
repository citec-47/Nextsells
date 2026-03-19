import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = body.reason || 'Application rejected';

  try {
    await query(
      `UPDATE approval_requests SET status = 'REJECTED', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await query(
      `UPDATE seller_profiles SET onboarding_status = 'REJECTED', rejection_reason = $2, updated_at = NOW()
       WHERE id = (SELECT seller_id FROM approval_requests WHERE id = $1)`,
      [id, reason]
    );

    return NextResponse.json({ success: true, message: 'Seller rejected' });
  } catch (error) {
    console.error('Reject seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
