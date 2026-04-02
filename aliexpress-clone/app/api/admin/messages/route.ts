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

type AdminMessageRow = {
  id?: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderRole: string;
  receiverRole: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

async function fetchMessagesFallback(adminUserId: string): Promise<AdminMessageRow[]> {
  const result = await query(
    `SELECT
       m.id,
       COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') AS "senderId",
       COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') AS "receiverId",
       COALESCE(s.name, 'Unknown') AS "senderName",
       COALESCE(r.name, 'Unknown') AS "receiverName",
       COALESCE(s.role, '') AS "senderRole",
       COALESCE(r.role, '') AS "receiverRole",
       m.content AS content,
       COALESCE(to_jsonb(m)->>'is_read', to_jsonb(m)->>'isRead', 'false')::boolean AS "isRead",
       COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt', NOW()::text) AS "createdAt"
     FROM messages m
     LEFT JOIN users s ON s.id = COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId')
     LEFT JOIN users r ON r.id = COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId')
     WHERE COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $1
        OR COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $1
     ORDER BY COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt') DESC`,
    [adminUserId]
  );

  return (result.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id || ''),
    senderId: String(row.senderId || ''),
    receiverId: String(row.receiverId || ''),
    senderName: String(row.senderName || 'Unknown'),
    receiverName: String(row.receiverName || 'Unknown'),
    senderRole: String(row.senderRole || ''),
    receiverRole: String(row.receiverRole || ''),
    content: String(row.content || ''),
    isRead: Boolean(row.isRead),
    createdAt: new Date(String(row.createdAt || new Date().toISOString())),
  }));
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
    if (!payload || String(payload.role).toUpperCase() !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    let messages: AdminMessageRow[] = [];
    try {
      const prismaMessages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: payload.userId }, { receiverId: payload.userId }],
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
          receiver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      messages = prismaMessages.map((message) => ({
        senderId: message.senderId,
        receiverId: message.receiverId,
        senderName: message.sender.name,
        receiverName: message.receiver.name,
        senderRole: message.sender.role,
        receiverRole: message.receiver.role,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      }));
    } catch {
      messages = await fetchMessagesFallback(payload.userId);
    }

    const visibleMessages = messages.filter(
      (message) =>
        String(message.content || '').trim() !== SYSTEM_CONVERSATION_BOOTSTRAP
        && !isDebugNoiseMessage(message.content)
    );

    const conversations = new Map<string, {
      otherUserId: string;
      otherUserName: string;
      otherUserRole: string;
      lastMessage: string;
      isRead: boolean;
      unreadCount: number;
      lastAt: Date;
    }>();

    const unreadByUser = new Map<string, number>();
    for (const message of visibleMessages) {
      if (message.receiverId === payload.userId && !message.isRead) {
        const current = unreadByUser.get(message.senderId) || 0;
        unreadByUser.set(message.senderId, current + 1);
      }
    }

    for (const message of visibleMessages) {
      const isSender = message.senderId === payload.userId;
      const otherUserId = isSender ? message.receiverId : message.senderId;
      const otherUserName = isSender ? message.receiverName : message.senderName;
      const otherUserRole = isSender ? message.receiverRole : message.senderRole;

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          otherUserId,
          otherUserName,
          otherUserRole,
          lastMessage: message.content,
          isRead: message.isRead,
          unreadCount: unreadByUser.get(otherUserId) || 0,
          lastAt: message.createdAt,
        });
      }
    }

    return successResponse({ conversations: Array.from(conversations.values()) });
  } catch (error) {
    console.error('Admin messages error:', error);
    return errorResponse('Internal server error', 500);
  }
}
