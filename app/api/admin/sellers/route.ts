import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token) || decodeToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await query(
      `SELECT
         sp.id            AS "sellerId",
         sp.company_name  AS "companyName",
         sp.onboarding_status AS "status",
         sp.is_premium    AS "isPremium",
         sp.logo_url      AS "logoUrl",
         sp.created_at    AS "createdAt",
         u.id             AS "userId",
         u.name           AS "userName",
         u.email          AS "userEmail",
         u.is_verified    AS "isVerified",
         u.is_blocked     AS "isBlocked",
         COUNT(DISTINCT p.id)::int AS "productCount"
       FROM seller_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN products p ON p.seller_id = sp.id
       GROUP BY sp.id, u.id
       ORDER BY sp.created_at DESC`
    );
    if (result.rows.length === 0) {
      const statusMap: Record<string, string> = {
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        PENDING_REVIEW: 'PENDING',
        IN_PROGRESS: 'PENDING',
        NOT_STARTED: 'NOT_STARTED',
      };

      const sellers = await prisma.sellerProfile.findMany({
        include: {
          user: true,
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        data: sellers.map((seller) => ({
          sellerId: seller.id,
          companyName: seller.companyName,
          status: statusMap[seller.status] || seller.status,
          isPremium: false,
          logoUrl: seller.logo ?? null,
          createdAt: seller.createdAt,
          userId: seller.user.id,
          userName: seller.user.name,
          userEmail: seller.user.email,
          isVerified: seller.user.isVerified,
          isBlocked: seller.user.isBlocked,
          productCount: seller._count.products,
        })),
      });
    }

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List sellers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
