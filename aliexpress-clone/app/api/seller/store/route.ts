import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

async function getSellerProfile(userId: string) {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      companyName: true,
      banner: true,
      logo: true,
      bio: true,
    },
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

    return successResponse({
      storeName: sellerResult.profile.companyName,
      banner: sellerResult.profile.banner,
      logo: sellerResult.profile.logo,
      bio: sellerResult.profile.bio,
    });
  } catch (error) {
    console.error('Seller store fetch error:', error);
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

    return successResponse(
      {
        storeName: updated.companyName,
        banner: updated.banner,
        logo: updated.logo,
        bio: updated.bio,
      },
      'Store customization updated'
    );
  } catch (error) {
    console.error('Seller store update error:', error);
    return errorResponse('Internal server error', 500);
  }
}