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
  const body = await request.json().catch(() => ({}));
  const reason = body.reason || 'Application rejected';

  try {
    const requestRecord = await prisma.approvalRequest.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        notes: reason,
      },
    });
    await prisma.sellerProfile.update({
      where: { id: requestRecord.sellerId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    return NextResponse.json({ success: true, message: 'Seller rejected' });
  } catch (error) {
    console.error('Reject seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
