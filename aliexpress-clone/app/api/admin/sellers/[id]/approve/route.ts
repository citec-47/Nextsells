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

  try {
    await query(
      `UPDATE approval_requests SET status = 'APPROVED', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    await query(
      `UPDATE seller_profiles SET onboarding_status = 'APPROVED', approval_date = NOW(), updated_at = NOW()
       WHERE id = (SELECT seller_id FROM approval_requests WHERE id = $1)`,
      [id]
    );

    return NextResponse.json({ success: true, message: 'Seller approved' });
  } catch (error) {
    console.error('Approve seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
