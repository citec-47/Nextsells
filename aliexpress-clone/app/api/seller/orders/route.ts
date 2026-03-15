import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

type SellerOrderBucket = {
  orderId: string;
  orderNumber: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: Date;
  totalAmount: number;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    subtotal: number;
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    const rows = await prisma.orderItem.findMany({
      where: { product: { sellerId: sellerProfile.id } },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
            buyer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
    });

    const orderMap = new Map<string, SellerOrderBucket>();

    for (const row of rows) {
      const key = row.order.id;
      const existing = orderMap.get(key);

      if (!existing) {
        orderMap.set(key, {
          orderId: row.order.id,
          orderNumber: row.order.orderNumber,
          status: row.order.status,
          buyerName: row.order.buyer.name,
          buyerEmail: row.order.buyer.email,
          createdAt: row.order.createdAt,
          totalAmount: row.subtotal,
          items: [
            {
              productId: row.product.id,
              title: row.product.title,
              quantity: row.quantity,
              subtotal: row.subtotal,
            },
          ],
        });
      } else {
        existing.totalAmount += row.subtotal;
        existing.items.push({
          productId: row.product.id,
          title: row.product.title,
          quantity: row.quantity,
          subtotal: row.subtotal,
        });
      }
    }

    return successResponse({
      orders: Array.from(orderMap.values()),
    });
  } catch (error) {
    console.error('Seller orders fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
