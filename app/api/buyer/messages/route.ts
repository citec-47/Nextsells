import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();
const SYSTEM_CONVERSATION_BOOTSTRAP = '__SYSTEM_CONVERSATION_BOOTSTRAP__';

function toConversationKey(a: string, b: string) {
  return [a, b].sort().join(':');
}

type SimpleUser = {
  id: string;
  name: string;
  role: string;
};

type SimpleMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

function normalizeRole(role: string | null | undefined) {
  return String(role || '').trim().toUpperCase();
}

function isBootstrapMessage(content: string | null | undefined) {
  return String(content || '').trim() === SYSTEM_CONVERSATION_BOOTSTRAP;
}

function isDebugNoiseMessage(content: string | null | undefined) {
  return /^E2E\s+(seller ping|admin reply)\s+\d+$/i.test(String(content || '').trim());
}

function isVisibleMessage(content: string | null | undefined) {
  return !isBootstrapMessage(content) && !isDebugNoiseMessage(content);
}

async function fetchMessagesFallback(currentUserId: string): Promise<SimpleMessage[]> {
  const sql = await query(
    `SELECT
       m.id,
       COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') AS "senderId",
       COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') AS "receiverId",
       m.content,
       COALESCE(to_jsonb(m)->>'is_read', to_jsonb(m)->>'isRead', 'false')::boolean AS "isRead",
       COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt', NOW()::text) AS "createdAt",
       COALESCE(s.name, 'Unknown') AS "senderName",
       COALESCE(r.name, 'Unknown') AS "receiverName",
       COALESCE(s.role, '') AS "senderRole",
       COALESCE(r.role, '') AS "receiverRole"
     FROM messages m
     LEFT JOIN users s ON s.id = COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId')
     LEFT JOIN users r ON r.id = COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId')
     WHERE COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $1
        OR COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $1
     ORDER BY COALESCE(to_jsonb(m)->>'created_at', to_jsonb(m)->>'createdAt') DESC
     LIMIT 300`,
    [currentUserId]
  );

  return (sql.rows as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id || ''),
    senderId: String(row.senderId || ''),
    senderName: String(row.senderName || 'Unknown'),
    senderRole: normalizeRole(String(row.senderRole || '')),
    receiverId: String(row.receiverId || ''),
    receiverName: String(row.receiverName || 'Unknown'),
    receiverRole: normalizeRole(String(row.receiverRole || '')),
    content: String(row.content || ''),
    isRead: Boolean(row.isRead),
    createdAt: new Date(String(row.createdAt || new Date().toISOString())),
  }));
}

async function resolveUserById(userId: string): Promise<SimpleUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (user) {
      return {
        id: user.id,
        name: user.name,
        role: normalizeRole(user.role),
      };
    }
  } catch {
    // fallback below
  }

  const fallback = await query(
    `SELECT id, COALESCE(name, 'Unknown') AS name, COALESCE(role, '') AS role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (fallback.rows.length === 0) {
    return null;
  }

  const row = fallback.rows[0] as { id: string; name: string; role: string };
  return {
    id: row.id,
    name: row.name,
    role: normalizeRole(row.role),
  };
}

async function hasConversationRecordBetween(userA: string, userB: string): Promise<boolean> {
  try {
    const count = await prisma.message.count({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
    });

    return count > 0;
  } catch {
    const fallback = await query(
      `SELECT 1
       FROM messages m
       WHERE (
         (COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $1 AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $2)
         OR
         (COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $2 AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $1)
       )
       LIMIT 1`,
      [userA, userB]
    );

    return fallback.rows.length > 0;
  }
}

async function createBootstrapConversationMessage(senderId: string, receiverId: string) {
  try {
    const hasPair = await hasConversationRecordBetween(senderId, receiverId);
    if (hasPair) {
      return;
    }

    await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: SYSTEM_CONVERSATION_BOOTSTRAP,
        isRead: true,
      },
      select: { id: true },
    });
    return;
  } catch {
    const messageId = randomUUID();
    try {
      await query(
        `INSERT INTO messages (id, "senderId", "receiverId", content, "isRead", "createdAt")
         SELECT $1, $2, $3, $4, TRUE, NOW()
         WHERE NOT EXISTS (
           SELECT 1
           FROM messages m
           WHERE (
             COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $2
             AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $3
           ) OR (
             COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $3
             AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $2
           )
         )`,
        [messageId, senderId, receiverId, SYSTEM_CONVERSATION_BOOTSTRAP]
      );
    } catch {
      await query(
        `INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
         SELECT $1, $2, $3, $4, TRUE, NOW()
         WHERE NOT EXISTS (
           SELECT 1
           FROM messages m
           WHERE (
             COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $2
             AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $3
           ) OR (
             COALESCE(to_jsonb(m)->>'sender_id', to_jsonb(m)->>'senderId') = $3
             AND COALESCE(to_jsonb(m)->>'receiver_id', to_jsonb(m)->>'receiverId') = $2
           )
         )`,
        [messageId, senderId, receiverId, SYSTEM_CONVERSATION_BOOTSTRAP]
      );
    }
  }
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
    if (!payload || String(payload.role).toUpperCase() !== 'BUYER') {
      return errorResponse('Buyer access required', 403);
    }

    let sellers: Array<{ id: string; name: string; role: string }> = [];

    try {
      sellers = await prisma.user.findMany({
        where: {
          role: 'SELLER',
          sellerProfile: {
            is: {
              products: {
                some: {
                  orderItems: {
                    some: {
                      order: {
                        buyerId: payload.userId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch {
      const fallback = await query(
        `SELECT DISTINCT u.id, u.name, u.role
         FROM users u
         JOIN seller_profiles sp ON sp.user_id = u.id
         JOIN products p ON p.seller_id = sp.id
         JOIN order_items oi ON oi.product_id = p.id
         JOIN orders o ON o.id = oi.order_id
         WHERE o.buyer_id = $1
           AND UPPER(u.role) = 'SELLER'
         ORDER BY u.name ASC`,
        [payload.userId]
      );

      sellers = (fallback.rows as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id || ''),
        name: String(row.name || 'Seller'),
        role: normalizeRole(String(row.role || 'SELLER')),
      }));
    }

    let messages: SimpleMessage[] = [];
    try {
      const prismaMessages = await prisma.message.findMany({
        where: {
          OR: [{ senderId: payload.userId }, { receiverId: payload.userId }],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      });

      messages = prismaMessages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderRole: normalizeRole(message.sender.role),
        receiverId: message.receiverId,
        receiverName: message.receiver.name,
        receiverRole: normalizeRole(message.receiver.role),
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      }));
    } catch {
      messages = await fetchMessagesFallback(payload.userId);
    }

    const conversations = new Map<string, {
      key: string;
      otherUserId: string;
      otherUserName: string;
      otherUserRole: string;
      lastMessage: string;
      unreadCount: number;
      lastAt: Date;
    }>();

    const conversationSourceMessages = messages.filter((message) => !isDebugNoiseMessage(message.content));
    const unreadByUser = new Map<string, number>();

    for (const message of conversationSourceMessages) {
      if (message.receiverId === payload.userId && !message.isRead && isVisibleMessage(message.content)) {
        const current = unreadByUser.get(message.senderId) || 0;
        unreadByUser.set(message.senderId, current + 1);
      }
    }

    for (const message of conversationSourceMessages) {
      const isSender = message.senderId === payload.userId;
      const otherId = isSender ? message.receiverId : message.senderId;
      const otherName = isSender ? message.receiverName : message.senderName;
      const otherRole = isSender ? message.receiverRole : message.senderRole;
      if (normalizeRole(otherRole) !== 'SELLER') {
        continue;
      }

      const key = toConversationKey(payload.userId, otherId);
      const conversationPreview = isBootstrapMessage(message.content)
        ? 'Conversation started'
        : message.content;
      if (!conversations.has(key)) {
        conversations.set(key, {
          key,
          otherUserId: otherId,
          otherUserName: otherName,
          otherUserRole: normalizeRole(otherRole),
          lastMessage: conversationPreview,
          unreadCount: unreadByUser.get(otherId) || 0,
          lastAt: message.createdAt,
        });
      }
    }

    const contactsMap = new Map<string, {
      userId: string;
      name: string;
      role: string;
      hasConversation: boolean;
      unreadCount: number;
      lastAt: Date;
    }>();

    for (const seller of sellers) {
      const sellerConversation = Array.from(conversations.values()).find(
        (conversation) => conversation.otherUserId === seller.id
      );
      contactsMap.set(seller.id, {
        userId: seller.id,
        name: seller.name,
        role: normalizeRole(seller.role),
        hasConversation: Boolean(sellerConversation),
        unreadCount: unreadByUser.get(seller.id) || 0,
        lastAt: sellerConversation?.lastAt || new Date(0),
      });
    }

    for (const conversation of conversations.values()) {
      if (!contactsMap.has(conversation.otherUserId)) {
        contactsMap.set(conversation.otherUserId, {
          userId: conversation.otherUserId,
          name: conversation.otherUserName,
          role: conversation.otherUserRole,
          hasConversation: true,
          unreadCount: unreadByUser.get(conversation.otherUserId) || 0,
          lastAt: conversation.lastAt,
        });
      }
    }

    const contacts = Array.from(contactsMap.values()).sort((a, b) => {
      if (a.hasConversation !== b.hasConversation) return a.hasConversation ? -1 : 1;
      if (a.lastAt.getTime() !== b.lastAt.getTime()) return b.lastAt.getTime() - a.lastAt.getTime();
      return a.name.localeCompare(b.name);
    });

    const orderedConversations = Array.from(conversations.values()).sort(
      (a, b) => b.lastAt.getTime() - a.lastAt.getTime()
    );

    const visibleMessages = messages.filter((message) => isVisibleMessage(message.content));

    return successResponse({
      currentUserId: payload.userId,
      contacts,
      conversations: orderedConversations,
      messages: visibleMessages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        receiverId: message.receiverId,
        receiverName: message.receiverName,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    console.error('Buyer messages fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || String(payload.role).toUpperCase() !== 'BUYER') {
      return errorResponse('Buyer access required', 403);
    }

    const body = await request.json() as { content?: string; receiverId?: string; bootstrapOnly?: boolean };
    const content = String(body.content || '').trim();
    const bootstrapOnly = Boolean(body.bootstrapOnly);

    const receiverId = String(body.receiverId || '').trim();
    if (!receiverId) {
      return errorResponse('receiverId is required', 400);
    }

    const receiver = await resolveUserById(receiverId);

    if (!receiver) {
      return errorResponse('Receiver not found', 404);
    }

    if (receiverId === payload.userId) {
      return errorResponse('Cannot send a message to yourself', 400);
    }

    if (receiver.role !== 'SELLER') {
      return errorResponse('Buyers can only message sellers', 403);
    }

    const hasConversationRecord = await hasConversationRecordBetween(payload.userId, receiverId);

    if (!hasConversationRecord) {
      await createBootstrapConversationMessage(payload.userId, receiverId);
    }

    if (bootstrapOnly) {
      return successResponse(
        {
          conversationReady: true,
          receiverId,
          created: !hasConversationRecord,
        },
        'Conversation ready'
      );
    }

    if (!content) {
      return errorResponse('Message content is required', 400);
    }

    let message: {
      id: string;
      senderId: string;
      receiverId: string;
      content: string;
      isRead: boolean;
      createdAt: Date;
    };

    try {
      message = await prisma.message.create({
        data: {
          senderId: payload.userId,
          receiverId,
          content,
        },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      });
    } catch {
      const messageId = randomUUID();
      try {
        await query(
          `INSERT INTO messages (id, "senderId", "receiverId", content, "isRead", "createdAt")
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [messageId, payload.userId, receiverId, content]
        );
      } catch {
        await query(
          `INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [messageId, payload.userId, receiverId, content]
        );
      }

      message = {
        id: messageId,
        senderId: payload.userId,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date(),
      };
    }

    return successResponse({ message }, 'Message sent', 201);
  } catch (error) {
    console.error('Buyer message send error:', error);
    return errorResponse('Internal server error', 500);
  }
}
