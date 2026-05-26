import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, adminId } = body;
    if (!id || !adminId) return NextResponse.json({ success: false, error: 'id and adminId required' }, { status: 400 });

    const existing = await prisma.aiSubscription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });
    if (existing.status !== 'PENDING') return NextResponse.json({ success: false, error: 'invalid status' }, { status: 400 });

    const approvedAt = new Date();
    const expiresAt = new Date(approvedAt.getTime() + 30*24*60*60*1000);

    const updated = await prisma.aiSubscription.update({ where: { id }, data: {
      status: 'ACTIVE',
      approvedAt,
      expiresAt,
      approvedBy: adminId,
    } });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Approve subscription error', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
