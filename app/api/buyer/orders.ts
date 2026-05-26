'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/buyer/orders
 * Create a new order (funds held until delivery)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    const body = await request.json();
    const { items, shippingAddress, city, state, zipCode, totalAmount, subtotal, tax, shippingCost } = body;

    // Validate required fields
    const errors = validateRequired(
      { shippingAddress, city, zipCode, totalAmount: totalAmount.toString() },
      ['shippingAddress', 'city', 'zipCode', 'totalAmount']
    );

    if (errors) {
      return validationError(errors);
    }

    if (!items || items.length === 0) {
      return errorResponse('Order must have at least one item', 400);
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: payload.userId,
        subtotal,
        tax,
        shippingCost,
        totalAmount,
        heldAmount: totalAmount, // Full amount held until delivery
        shippingAddress: `${shippingAddress}, ${city}, ${state} ${zipCode}`,
        status: 'CONFIRMED',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            subtotal: item.pricePerUnit * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return successResponse(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        heldAmount: order.heldAmount,
        message: 'Order created successfully. Payment is held until delivery.',
      },
      'Order created successfully',
      201
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * GET /api/buyer/orders
 * Get buyer's orders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    // Fetch buyer's orders
    const orders = await prisma.order.findMany({
      where: { buyerId: payload.userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return errorResponse('Internal server error', 500);
  }
}
