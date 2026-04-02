import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

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
    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    const body = (await request.json()) as { participantId?: string };
    const participantId = String(body.participantId || '').trim();

    if (!participantId) {
      return errorResponse('participantId is required', 400);
    }

    if (participantId === payload.userId) {
      return successResponse({ updatedCount: 0 }, 'Already up to date');
    }

    try {
      const result = await prisma.message.updateMany({
        where: {
          senderId: participantId,
          receiverId: payload.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return successResponse({ updatedCount: result.count });
    } catch {
      try {
        const result = await query(
          `UPDATE messages
           SET "isRead" = TRUE
           WHERE COALESCE(to_jsonb(messages)->>'sender_id', to_jsonb(messages)->>'senderId') = $1
             AND COALESCE(to_jsonb(messages)->>'receiver_id', to_jsonb(messages)->>'receiverId') = $2
             AND COALESCE(to_jsonb(messages)->>'is_read', to_jsonb(messages)->>'isRead', 'false')::boolean = FALSE`,
          [participantId, payload.userId]
        );

        return successResponse({ updatedCount: result.rowCount || 0 });
      } catch {
        const result = await query(
          `UPDATE messages
           SET is_read = TRUE
           WHERE COALESCE(to_jsonb(messages)->>'sender_id', to_jsonb(messages)->>'senderId') = $1
             AND COALESCE(to_jsonb(messages)->>'receiver_id', to_jsonb(messages)->>'receiverId') = $2
             AND COALESCE(to_jsonb(messages)->>'is_read', to_jsonb(messages)->>'isRead', 'false')::boolean = FALSE`,
          [participantId, payload.userId]
        );

        return successResponse({ updatedCount: result.rowCount || 0 });
      }
    }
  } catch (error) {
    console.error('Mark-as-read error:', error);
    return errorResponse('Internal server error', 500);
  }
}
