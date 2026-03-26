import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const SYSTEM_CONVERSATION_BOOTSTRAP = '__SYSTEM_CONVERSATION_BOOTSTRAP__';

function isDebugNoiseMessage(content: string | null | undefined) {
  return /^E2E\s+(seller ping|admin reply)\s+\d+$/i.test(String(content || '').trim());
}

async function targetExists(userId: string): Promise<boolean> {
  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return Boolean(target);
  } catch {
    const fallback = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [userId]);
    return fallback.rows.length > 0;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    const { userId } = await params;

    if (!(await targetExists(userId))) {
      return errorResponse('Conversation target not found', 404);
    }

    let visibleMessages: Array<{
      id: string;
      senderId: string;
      receiverId: string;
      content: string;
      isRead: boolean;
      createdAt: Date;
      senderName: string;
    }> = [];

    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: payload.userId, receiverId: userId },
            { senderId: userId, receiverId: payload.userId },
          ],
        },
        include: {
          sender: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      visibleMessages = messages
        .filter(
          (message) =>
            String(message.content || '').trim() !== SYSTEM_CONVERSATION_BOOTSTRAP
            && !isDebugNoiseMessage(message.content)
        )
        .map((message) => ({
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
          senderName: message.sender.name,
        }));
    } catch {
      const fallback = await query(
        `SELECT
           m.id,
           COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') AS "senderId",
           COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') AS "receiverId",
           m.content,
           COALESCE(to_jsonb(m)->>'is_read', to_jsonb(m)->>'isRead', 'false')::boolean AS "isRead",
           COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt', NOW()::text) AS "createdAt",
           COALESCE(s.name, 'Unknown') AS "senderName"
         FROM messages m
         LEFT JOIN users s ON s.id = COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId')
         WHERE (
           COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $1
           AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $2
         ) OR (
           COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $2
           AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $1
         )
         ORDER BY COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt') ASC`,
        [payload.userId, userId]
      );

      visibleMessages = (fallback.rows as Array<Record<string, unknown>>)
        .filter(
          (row) =>
            String(row.content || '').trim() !== SYSTEM_CONVERSATION_BOOTSTRAP
            && !isDebugNoiseMessage(String(row.content || ''))
        )
        .map((row) => ({
          id: String(row.id || ''),
          senderId: String(row.senderId || ''),
          receiverId: String(row.receiverId || ''),
          content: String(row.content || ''),
          isRead: Boolean(row.isRead),
          createdAt: new Date(String(row.createdAt || new Date().toISOString())),
          senderName: String(row.senderName || 'Unknown'),
        }));
    }

    return successResponse({
      messages: visibleMessages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        senderName: message.senderName,
      })),
    });
  } catch (error) {
    console.error('Fetch conversation error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    const { userId } = await params;

    const body = (await request.json()) as { content: string };
    if (!body.content?.trim()) {
      return errorResponse('Message content is required', 400);
    }

    if (!(await targetExists(userId))) {
      return errorResponse('Conversation target not found', 404);
    }

    let messageId = '';

    try {
      const message = await prisma.message.create({
        data: {
          senderId: payload.userId,
          receiverId: userId,
          content: body.content.trim(),
        },
        select: { id: true },
      });
      messageId = message.id;
    } catch {
      messageId = randomUUID();
      try {
        await query(
          `INSERT INTO messages (id, "senderId", "receiverId", content, "isRead", "createdAt")
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [messageId, payload.userId, userId, body.content.trim()]
        );
      } catch {
        await query(
          `INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [messageId, payload.userId, userId, body.content.trim()]
        );
      }
    }

    return successResponse(
      { messageId },
      'Message sent',
      201
    );
  } catch (error) {
    console.error('Send message error:', error);
    return errorResponse('Internal server error', 500);
  }
}
