import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();
const SYSTEM_CONVERSATION_BOOTSTRAP = '__SYSTEM_CONVERSATION_BOOTSTRAP__';

function isDebugNoiseMessage(content: string | null | undefined) {
  return /^E2E\s+(seller ping|admin reply)\s+\d+$/i.test(String(content || '').trim());
}

function isVisibleMessage(content: string | null | undefined) {
  const value = String(content || '').trim();
  return value !== SYSTEM_CONVERSATION_BOOTSTRAP && !isDebugNoiseMessage(value);
}

export async function GET(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;

    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    const userId = payload.userId;

    try {
      const unreadMessages = await prisma.message.findMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      const unreadByUser = new Map<string, { count: number; name: string; role: string }>();

      for (const message of unreadMessages) {
        if (!isVisibleMessage(message.content)) {
          continue;
        }

        const existing = unreadByUser.get(message.senderId);
        if (existing) {
          existing.count += 1;
        } else {
          unreadByUser.set(message.senderId, {
            count: 1,
            name: message.sender.name,
            role: String(message.sender.role || '').toUpperCase(),
          });
        }
      }

      const unreadList = Array.from(unreadByUser.entries()).map(([otherUserId, data]) => ({
        otherUserId,
        otherUserName: data.name,
        otherUserRole: data.role,
        unreadCount: data.count,
      }));

      const totalUnread = unreadList.reduce((sum, item) => sum + item.unreadCount, 0);

      return successResponse({
        totalUnread,
        unreadByUser: unreadList,
      });
    } catch {
      const result = await query(
        `SELECT
           COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') AS "senderId",
           COALESCE(s.name, 'Unknown') AS "senderName",
           COALESCE(s.role, '') AS "senderRole",
           m.content,
           COUNT(*)::int AS "unreadCount"
         FROM messages m
         LEFT JOIN users s ON s.id = COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId')
         WHERE COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $1
           AND COALESCE(to_jsonb(m)->>'is_read', to_jsonb(m)->>'isRead', 'false')::boolean = FALSE
         GROUP BY
           COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId'),
           COALESCE(s.name, 'Unknown'),
           COALESCE(s.role, ''),
           m.content`,
        [userId]
      );

      const merged = new Map<string, { count: number; name: string; role: string }>();

      for (const row of result.rows as Array<Record<string, unknown>>) {
        const senderId = String(row.senderId || '');
        const content = String(row.content || '');
        if (!senderId || !isVisibleMessage(content)) {
          continue;
        }

        const previous = merged.get(senderId);
        const rowCount = Number(row.unreadCount || 0);
        if (previous) {
          previous.count += rowCount;
        } else {
          merged.set(senderId, {
            count: rowCount,
            name: String(row.senderName || 'Unknown'),
            role: String(row.senderRole || '').toUpperCase(),
          });
        }
      }

      const unreadList = Array.from(merged.entries()).map(([otherUserId, data]) => ({
        otherUserId,
        otherUserName: data.name,
        otherUserRole: data.role,
        unreadCount: data.count,
      }));

      const totalUnread = unreadList.reduce((sum, item) => sum + item.unreadCount, 0);

      return successResponse({
        totalUnread,
        unreadByUser: unreadList,
      });
    }
  } catch (error) {
    console.error('Unread count fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
