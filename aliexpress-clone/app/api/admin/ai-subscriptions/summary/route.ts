import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const pending = await prisma.aiSubscription.count({ where: { status: 'PENDING' } });
    const activeList = await prisma.aiSubscription.findMany({ where: { status: 'ACTIVE' } });
    const active = activeList.length;
    const revenue = activeList.reduce((s: number, r: any) => s + (r.paymentAmount || 0), 0);

    return NextResponse.json({ success: true, stats: { pending, active, revenue } });
  } catch (err) {
    console.error('Summary error', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
