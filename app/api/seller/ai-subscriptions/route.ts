import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');
    if (!sellerId) return NextResponse.json({ success: false, error: 'sellerId required' }, { status: 400 });

    const list = await prisma.aiSubscription.findMany({ where: { sellerId } });
    // compute status if expiresAt passed
    const mapped = list.map((r: any) => {
      let status = r.status;
      if (status === 'ACTIVE' && r.expiresAt) {
        const expires = new Date(r.expiresAt);
        if (expires <= new Date()) status = 'EXPIRED';
      }
      const daysRemaining = r.expiresAt ? Math.max(0, Math.ceil((new Date(r.expiresAt).getTime() - Date.now()) / (1000*60*60*24))) : null;
      return { ...r, status, daysRemaining };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Get ai subscriptions error', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
