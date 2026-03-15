import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

async function getApprovedSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!sellerProfile) {
    return { error: errorResponse('Seller profile not found', 404), profile: null };
  }

  if (sellerProfile.status !== 'APPROVED') {
    return {
      error: errorResponse('Your seller profile must be approved before publishing products', 403),
      profile: null,
    };
  }

  return { error: null, profile: sellerProfile };
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerResult = await getApprovedSellerProfile(payload.userId);
    if (sellerResult.error || !sellerResult.profile) {
      return sellerResult.error;
    }

    const body = await request.json() as {
      externalId?: number;
      title?: string;
      description?: string;
      category?: string;
      basePrice?: number;
      stock?: number;
      images?: string[];
      brand?: string;
    };

    const title = body.title?.trim();
    if (!title || typeof body.basePrice !== 'number') {
      return errorResponse('Invalid catalog product payload', 422);
    }

    const profitMargin = 20;
    const sellingPrice = Number((body.basePrice + (body.basePrice * profitMargin) / 100).toFixed(2));
    const externalId = body.externalId || Date.now();
    const sellerId = sellerResult.profile.id;

    const existingProduct = await prisma.product.findFirst({
      where: {
        sellerId,
        sku: `CAT-${sellerId}-${externalId}`,
      },
    });

    if (existingProduct) {
      return errorResponse('This catalog product is already published in your store', 409);
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: body.description || '',
        category: body.category || 'Other',
        basePrice: body.basePrice,
        sellingPrice,
        profitMargin,
        stock: body.stock || 0,
        sku: `CAT-${sellerId}-${externalId}`,
        images: ((body.images && body.images.length > 0) ? body.images : ['/placeholder.jpg']) as any,
        isPublished: true,
        sellerId,
      },
    });

    return successResponse(
      {
        id: product.id,
        title: product.title,
        source: body.brand || 'Catalog Supplier',
        sellingPrice: product.sellingPrice,
        isPublished: product.isPublished,
      },
      'Catalog product published to your store',
      201
    );
  } catch (error) {
    console.error('Product import error:', error);
    return errorResponse('Internal server error', 500);
  }
}