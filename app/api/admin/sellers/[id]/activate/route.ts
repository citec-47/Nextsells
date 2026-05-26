import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const result = await query(
      `UPDATE users SET is_blocked = FALSE, updated_at = NOW()
       WHERE id = (SELECT user_id FROM seller_profiles WHERE id = $1)`,
      [id]
    );
    if (result.rowCount === 0) {
      const seller = await prisma.sellerProfile.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }
      await prisma.user.update({ where: { id: seller.userId }, data: { isBlocked: false } });
    }
    return NextResponse.json({ success: true, message: 'Seller activated' });
  } catch (error) {
    console.error('Activate seller error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
