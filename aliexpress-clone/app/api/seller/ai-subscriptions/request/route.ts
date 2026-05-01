import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sellerId, paymentAmount = 500, paymentProof, currency = 'USD' } = body;
    if (!sellerId) return NextResponse.json({ success: false, error: 'sellerId required' }, { status: 400 });

    const record = await prisma.aiSubscription.create({ data: {
      sellerId,
      status: 'PENDING',
      paymentAmount,
      paymentProof,
      currency,
      requestedAt: new Date(),
    } });

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error('Create ai subscription error', err);
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 });
  }
}
