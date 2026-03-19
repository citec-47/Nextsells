import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    // Cascade deletes seller_profiles + related data via FK constraints
    await query(`DELETE FROM users WHERE id = (SELECT user_id FROM seller_profiles WHERE id = $1)`, [id]);
    return NextResponse.json({ success: true, message: 'Seller deleted' });
  } catch (error) {
    console.error('Delete seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
