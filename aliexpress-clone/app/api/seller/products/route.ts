import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';

const prisma = new PrismaClient();

function parseImageList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
    return [];
  } catch {
    return raw ? [raw] : [];
  }
}

async function getApprovedSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!sellerProfile) {
    return { error: errorResponse('Seller profile not found', 404), profile: null };
  }

  if (sellerProfile.status !== 'APPROVED') {
    return {
      error: errorResponse('Your seller profile must be approved before listing products', 403),
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

    const formData = await request.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || 'Other';
    const basePrice = Number.parseFloat((formData.get('basePrice') as string) || '0');
    const sellingPrice = Number.parseFloat((formData.get('sellingPrice') as string) || '0');
    const profitMargin = Number.parseFloat((formData.get('profitMargin') as string) || '0');
    const stock = Number.parseInt((formData.get('stock') as string) || '0', 10);
    const sku = (formData.get('sku') as string) || undefined;

    const requiredErrors = validateRequired(
      { title, basePrice: `${basePrice}`, stock: `${stock}` },
      ['title', 'basePrice', 'stock']
    );

    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    const imageFiles = formData.getAll('images') as File[];
    const imageUrls = imageFiles.map((file) => `/uploads/products/${file.name}`);

    const product = await prisma.product.create({
      data: {
        title,
        description,
        category,
        basePrice,
        sellingPrice,
        profitMargin,
        stock,
        sku,
        images: (imageUrls.length > 0 ? imageUrls : ['/placeholder.jpg']) as any,
        isPublished: true,
        sellerId: sellerResult.profile.id,
      },
    });

    return successResponse(
      {
        id: product.id,
        title: product.title,
        sellingPrice: product.sellingPrice,
        profitMargin: product.profitMargin,
        isPublished: product.isPublished,
      },
      'Product published successfully',
      201
    );
  } catch (error) {
    console.error('Product creation error:', error);
    return errorResponse('Internal server error', 500);
  }
}

async function getSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
  });

  if (!sellerProfile) {
    return { error: errorResponse('Seller profile not found', 404), profile: null };
  }

  return { error: null, profile: sellerProfile };
}

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

    const sellerResult = await getSellerProfile(payload.userId);
    if (sellerResult.error || !sellerResult.profile) {
      return sellerResult.error;
    }

    const products = await prisma.product.findMany({
      where: { sellerId: sellerResult.profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        basePrice: true,
        sellingPrice: true,
        profitMargin: true,
        stock: true,
        isPublished: true,
        images: true,
        createdAt: true,
      },
    });

    return successResponse({
      storeName: sellerResult.profile.companyName,
      banner: sellerResult.profile.banner,
      logo: sellerResult.profile.logo,
      bio: sellerResult.profile.bio,
      products: products.map((product) => {
        const imageList = parseImageList(product.images);
        return {
          ...product,
          image: imageList[0] || '/placeholder.jpg',
        };
      }),
    });
  } catch (error) {
    console.error('Seller products fetch error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerResult = await getSellerProfile(payload.userId);
    if (sellerResult.error || !sellerResult.profile) {
      return sellerResult.error;
    }

    const body = (await request.json()) as {
      banner?: string;
      logo?: string;
      bio?: string;
    };

    const nextBanner = typeof body.banner === 'string' ? body.banner.trim() : undefined;
    const nextLogo = typeof body.logo === 'string' ? body.logo.trim() : undefined;
    const nextBio = typeof body.bio === 'string' ? body.bio.trim() : undefined;

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerResult.profile.id },
      data: {
        ...(nextBanner !== undefined ? { banner: nextBanner || null } : {}),
        ...(nextLogo !== undefined ? { logo: nextLogo || null } : {}),
        ...(nextBio !== undefined ? { bio: nextBio || null } : {}),
      },
      select: {
        companyName: true,
        banner: true,
        logo: true,
        bio: true,
      },
    });

    return successResponse({
      storeName: updated.companyName,
      banner: updated.banner,
      logo: updated.logo,
      bio: updated.bio,
    }, 'Store customization updated');
  } catch (error) {
    console.error('Seller store customization update error:', error);
    return errorResponse('Internal server error', 500);
  }
}