import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseImageList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Fallback handled below
  }

  return raw ? [raw] : [];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = String(slug || '').trim().toLowerCase();

    if (!normalizedSlug) {
      return errorResponse('Store slug is required', 422);
    }

    const sellers = await prisma.sellerProfile.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        companyName: true,
        bio: true,
        banner: true,
        logo: true,
      },
    });

    const seller = sellers.find((row) => toSlug(row.companyName || '') === normalizedSlug);
    if (!seller) {
      return errorResponse('Store not found', 404);
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: seller.id,
        isPublished: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        sellingPrice: true,
        images: true,
        createdAt: true,
      },
    });

    return successResponse({
      slug: normalizedSlug,
      store: {
        name: seller.companyName,
        bio: seller.bio,
        banner: seller.banner,
        logo: seller.logo,
      },
      products: products.map((product) => {
        const imageList = parseImageList(product.images);
        return {
          ...product,
          image: imageList[0] || '/placeholder.jpg',
        };
      }),
    });
  } catch (error) {
    console.error('Public store fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}
