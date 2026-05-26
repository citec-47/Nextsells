import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const list = await prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: list.map((row) => ({
        requestId: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        sellerId: row.sellerId,
        companyName: row.seller.companyName,
        userName: row.seller.user.name,
        userEmail: row.seller.user.email,
      })),
    });
  } catch (error) {
    console.error('Pending sellers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
