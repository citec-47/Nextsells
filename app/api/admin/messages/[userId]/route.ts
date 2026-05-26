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
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '40');
    const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 40, 10), 100);
    const before = request.nextUrl.searchParams.get('before');
    const beforeDate = before ? new Date(before) : null;
    const hasBeforeDate = Boolean(beforeDate && !Number.isNaN(beforeDate.getTime()));

    if (!(await targetExists(userId))) {
      return errorResponse('Conversation target not found', 404);
    }

    try {
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId: payload.userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    } catch {
      try {
        await query(
          `UPDATE messages
           SET "isRead" = TRUE
           WHERE COALESCE(to_jsonb(messages)->>'sender_id', to_jsonb(messages)->>'senderId') = $1
             AND COALESCE(to_jsonb(messages)->>'receiver_id', to_jsonb(messages)->>'receiverId') = $2
             AND COALESCE(to_jsonb(messages)->>'is_read', to_jsonb(messages)->>'isRead', 'false')::boolean = FALSE`,
          [userId, payload.userId]
        );
      } catch {
        await query(
          `UPDATE messages
           SET is_read = TRUE
           WHERE COALESCE(to_jsonb(messages)->>'sender_id', to_jsonb(messages)->>'senderId') = $1
             AND COALESCE(to_jsonb(messages)->>'receiver_id', to_jsonb(messages)->>'receiverId') = $2
             AND COALESCE(to_jsonb(messages)->>'is_read', to_jsonb(messages)->>'isRead', 'false')::boolean = FALSE`,
          [userId, payload.userId]
        );
      }
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
          ...(hasBeforeDate ? { createdAt: { lt: beforeDate as Date } } : {}),
        },
        include: {
          sender: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      });

      const page = messages
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

      const hasMore = page.length > limit;
      const sliced = hasMore ? page.slice(0, limit) : page;
      visibleMessages = sliced.reverse();

      const nextCursor = hasMore
        ? sliced[sliced.length - 1]?.createdAt?.toISOString() || null
        : null;

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
        pagination: {
          hasMore,
          nextCursor,
          limit,
        },
      });
    } catch {
      const beforeClause = hasBeforeDate
        ? ` AND COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt', NOW()::text)::timestamptz < $3 `
        : '';
      const paramsList = hasBeforeDate
        ? [payload.userId, userId, (beforeDate as Date).toISOString(), limit + 1]
        : [payload.userId, userId, limit + 1];
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
         ${beforeClause}
         ORDER BY COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt') DESC
         LIMIT $${hasBeforeDate ? '4' : '3'}`,
        paramsList
      );

      const page = (fallback.rows as Array<Record<string, unknown>>)
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

      const hasMore = page.length > limit;
      const sliced = hasMore ? page.slice(0, limit) : page;
      visibleMessages = sliced.reverse();

      const nextCursor = hasMore
        ? sliced[sliced.length - 1]?.createdAt?.toISOString() || null
        : null;

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
        pagination: {
          hasMore,
          nextCursor,
          limit,
        },
      });
    }
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
