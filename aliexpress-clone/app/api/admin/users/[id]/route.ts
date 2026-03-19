import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    // Prevent admin from deleting themselves
    if (payload.userId === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check user exists
    const existing = await query(`SELECT id, role FROM users WHERE id = $1`, [id]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete related records first (cascade safe order)
    await query(`DELETE FROM seller_profiles WHERE user_id = $1`, [id]);
    await query(`DELETE FROM orders WHERE buyer_id = $1`, [id]);
    await query(`DELETE FROM users WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
