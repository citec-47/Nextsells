import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { successResponse, errorResponse } from '@/lib/utils/api'

const prisma = new PrismaClient()

/**
 * GET /api/seller/ai-analysis/products
 * Return all products for AI analysis (published or not)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageStr = searchParams.get('page') || '1'
    const page = Number.parseInt(pageStr, 10)
    const pageSize = 12

    const products = await prisma.product.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        basePrice: true,
        sellingPrice: true,
        stock: true,
        images: true,
        createdAt: true,
      },
    })

    const total = await prisma.product.count()

    return successResponse({
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('AI analysis products error:', error)
    return errorResponse(message, 500)
  }
}
