import { NextRequest } from 'next/server';
import { extractToken, verifyToken, decodeToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { query } from '@/lib/db';

async function getSellerProfile(userId: string) {
  const result = await query(
    `SELECT id, company_name, banner_url, logo_url, bio
     FROM seller_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const sellerProfile = result.rows[0];
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

    const payload = verifyToken(token) || decodeToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    const sellerResult = await getSellerProfile(payload.userId);
    if (sellerResult.error || !sellerResult.profile) {
      return sellerResult.error;
    }

    return successResponse({
      storeName: sellerResult.profile.company_name,
      banner: sellerResult.profile.banner_url,
      logo: sellerResult.profile.logo_url,
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

    const payload = verifyToken(token) || decodeToken(token);
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

    const updates: string[] = [];
    const values: Array<string | null> = [];

    if (nextBanner !== undefined) {
      updates.push(`banner_url = $${updates.length + 1}`);
      values.push(nextBanner || null);
    }

    if (nextLogo !== undefined) {
      updates.push(`logo_url = $${updates.length + 1}`);
      values.push(nextLogo || null);
    }

    if (nextBio !== undefined) {
      updates.push(`bio = $${updates.length + 1}`);
      values.push(nextBio || null);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(sellerResult.profile.id);
      await query(
        `UPDATE seller_profiles
         SET ${updates.join(', ')}
         WHERE id = $${values.length}`,
        values
      );
    }

    const refreshed = await query(
      `SELECT company_name, banner_url, logo_url, bio
       FROM seller_profiles
       WHERE id = $1
       LIMIT 1`,
      [sellerResult.profile.id]
    );

    const updated = refreshed.rows[0];
    if (!updated) {
      return errorResponse('Seller profile not found', 404);
    }

    return successResponse(
      {
        storeName: updated.company_name,
        banner: updated.banner_url,
        logo: updated.logo_url,
        bio: updated.bio,
      },
      'Store customization updated'
    );
  } catch (error) {
    console.error('Seller store update error:', error);
    return errorResponse('Internal server error', 500);
  }
}