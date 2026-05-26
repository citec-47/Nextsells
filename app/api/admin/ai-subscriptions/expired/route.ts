import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const list = await prisma.aiSubscription.findMany({ where: { status: 'EXPIRED' } })
    return NextResponse.json({ success: true, data: list })
  } catch (err) {
    console.error('Admin expired list error', err)
    return NextResponse.json({ success: false, error: 'internal' }, { status: 500 })
  }
}
