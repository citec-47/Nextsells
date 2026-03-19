import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function PATCH(
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
    const body = await request.json();
    const isBlocked = Boolean(body?.isBlocked);

    const result = await query(
      `
        UPDATE users
        SET is_blocked = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id AS "userId", is_blocked AS "isBlocked"
      `,
      [id, isBlocked],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Admin user status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
