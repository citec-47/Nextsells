import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({})) as { reason?: string };
    await query(
      `UPDATE withdrawals SET status = 'rejected', reviewed_at = NOW(), notes = COALESCE($1, notes) WHERE id = $2`,
      [body.reason ?? null, id],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
