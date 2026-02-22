'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * GET /api/buyer/products
 * Get all published products (buyers browsing)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const pageStr = searchParams.get('page') || '1';
    const page = parseInt(pageStr);
    const pageSize = 12;

    // Build filter
    const filter: any = { isPublished: true };
    if (category) filter.category = category;
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch products with seller info
    const products = await prisma.product.findMany({
      where: filter,
      include: {
        seller: {
          select: {
            companyName: true,
            rating: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.product.count({ where: filter });

    return successResponse({
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return errorResponse('Internal server error', 500);
  }
}
