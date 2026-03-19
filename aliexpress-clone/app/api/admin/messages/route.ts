import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

// Ensure messages table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id           VARCHAR(255) PRIMARY KEY,
      sender_id    VARCHAR(255) NOT NULL,
      receiver_id  VARCHAR(255) NOT NULL,
      content      TEXT NOT NULL,
      is_read      BOOLEAN  DEFAULT FALSE,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
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

    // Get all unique conversation pairs with latest message
    const res = await query(`
      WITH latest_messages AS (
        SELECT
          LEAST(sender_id, receiver_id) AS user1,
          GREATEST(sender_id, receiver_id) AS user2,
          content,
          is_read,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
            ORDER BY created_at DESC
          ) AS rn
        FROM messages
      )
      SELECT
        user1,
        user2,
        content AS "lastMessage",
        is_read AS "isRead",
        created_at AS "lastAt",
        u1.name AS "user1Name",
        u1.role AS "user1Role",
        u2.name AS "user2Name",
        u2.role AS "user2Role"
      FROM latest_messages lm
      JOIN users u1 ON lm.user1 = u1.id
      JOIN users u2 ON lm.user2 = u2.id
      WHERE rn = 1
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Admin messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
