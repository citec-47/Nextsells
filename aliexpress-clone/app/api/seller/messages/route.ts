import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

function toConversationKey(a: string, b: string) {
  return [a, b].sort().join(':');
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const messages = await prisma.message.findMany({
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
    });

    const conversations = new Map<string, {
      key: string;
      otherUserId: string;
      otherUserName: string;
      otherUserRole: string;
      lastMessage: string;
      lastAt: Date;
    }>();

    for (const message of messages) {
      const other = message.senderId === payload.userId ? message.receiver : message.sender;
      const key = toConversationKey(payload.userId, other.id);
      if (!conversations.has(key)) {
        conversations.set(key, {
          key,
          otherUserId: other.id,
          otherUserName: other.name,
          otherUserRole: other.role,
          lastMessage: message.content,
          lastAt: message.createdAt,
        });
      }
    }

    return successResponse({
      currentUserId: payload.userId,
      conversations: Array.from(conversations.values()),
      messages: messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.name,
        receiverId: message.receiverId,
        receiverName: message.receiver.name,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    console.error('Seller messages fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const body = await request.json() as { content?: string; receiverId?: string };
    const content = String(body.content || '').trim();

    if (!content) {
      return errorResponse('Message content is required', 400);
    }

    let receiverId = body.receiverId;

    if (!receiverId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (!admin) {
        return errorResponse('No admin is available for messaging', 404);
      }

      receiverId = admin.id;
    }

    const message = await prisma.message.create({
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

    return successResponse({ message }, 'Message sent', 201);
  } catch (error) {
    console.error('Seller message send error:', error);
    return errorResponse('Internal server error', 500);
  }
}
