import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  try {
    // Get conversation threads with this user (for any other participant)
    const res = await query(
      `SELECT
         id,
         sender_id AS "senderId",
         receiver_id AS "receiverId",
         content,
         is_read AS "isRead",
         created_at AS "createdAt",
         (SELECT name FROM users WHERE id = sender_id) AS "senderName"
       FROM messages
       WHERE (sender_id = $1 OR receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId],
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Fetch conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  try {
    const body = (await request.json()) as { content: string };
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    // Insert message from admin to the user
    const id = randomUUID();
    await query(
      `INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, 'ADMIN_USER', $2, $3)`,
      [id, userId, body.content],
    );

    return NextResponse.json({ success: true, messageId: id });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
