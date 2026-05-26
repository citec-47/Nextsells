import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: payload.userId,
      },
    });
    await prisma.sellerProfile.update({
      where: { id: request.sellerId },
      data: { status: 'APPROVED' },
    });

    return NextResponse.json({ success: true, message: 'Seller approved' });
  } catch (error) {
    console.error('Approve seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
