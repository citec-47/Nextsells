import { NextRequest } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

type SellerContext = {
  id: string;
  userId: string;
  sellerProfileId: string;
  sellerIdForProduct: string;
  mode: 'prisma' | 'legacy';
};

function normalizeStatus(status: unknown): string {
  return String(status || '').trim().toUpperCase();
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function getTableColumns(tableName: string): Promise<Set<string>> {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1`,
    [tableName]
  );
  return new Set(result.rows.map((row) => String(row.column_name)));
}

function pickFirstExisting(columns: Set<string>, candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (columns.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function resolveLegacySellerIdValue(args: {
  sellerColumn: string;
  userId: string;
  sellerProfileId: string;
}): Promise<string> {
  const fkResult = await query(
    `SELECT ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
       AND tc.table_name = 'products'
       AND kcu.column_name = $1
     LIMIT 1`,
    [args.sellerColumn]
  );

  if (fkResult.rows.length === 0) {
    return args.sellerProfileId;
  }

  const fk = fkResult.rows[0] as { foreign_table?: string; foreign_column?: string };
  const foreignTable = String(fk.foreign_table || '');
  const foreignColumn = String(fk.foreign_column || 'id');

  if (foreignTable === 'users') {
    return args.userId;
  }

  if (foreignTable === 'seller_profiles') {
    return args.sellerProfileId;
  }

  // For unexpected schemas, prefer the value that actually exists in the FK table.
  if (foreignTable) {
    const userExists = await query(
      `SELECT 1 FROM ${quoteIdentifier(foreignTable)} WHERE ${quoteIdentifier(foreignColumn)} = $1 LIMIT 1`,
      [args.userId]
    );
    if (userExists.rows.length > 0) {
      return args.userId;
    }

    const sellerExists = await query(
      `SELECT 1 FROM ${quoteIdentifier(foreignTable)} WHERE ${quoteIdentifier(foreignColumn)} = $1 LIMIT 1`,
      [args.sellerProfileId]
    );
    if (sellerExists.rows.length > 0) {
      return args.sellerProfileId;
    }
  }

  return args.sellerProfileId;
}

async function getApprovedSellerProfile(userId: string): Promise<{ error: ReturnType<typeof errorResponse> | null; profile: SellerContext | null }> {
  try {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!sellerProfile) {
      return { error: errorResponse('Seller profile not found', 404), profile: null };
    }

    if (normalizeStatus(sellerProfile.status) !== 'APPROVED') {
      return {
        error: errorResponse('Your seller profile must be approved before publishing products', 403),
        profile: null,
      };
    }

    return {
      error: null,
      profile: {
        id: sellerProfile.id,
        userId,
        sellerProfileId: sellerProfile.id,
        sellerIdForProduct: sellerProfile.id,
        mode: 'prisma',
      },
    };
  } catch (error) {
    const prismaMissingTable =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
    if (!prismaMissingTable) {
      throw error;
    }
  }

  const fallbackProfile = await query(
    `SELECT id, onboarding_status
     FROM seller_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  if (fallbackProfile.rows.length === 0) {
    return { error: errorResponse('Seller profile not found', 404), profile: null };
  }

  const profile = fallbackProfile.rows[0] as { id: string; onboarding_status: string | null };
  if (normalizeStatus(profile.onboarding_status) !== 'APPROVED') {
    return {
      error: errorResponse('Your seller profile must be approved before publishing products', 403),
      profile: null,
    };
  }

  return {
    error: null,
    profile: {
      id: profile.id,
      userId,
      sellerProfileId: profile.id,
      // This will be resolved dynamically before legacy insert.
      sellerIdForProduct: profile.id,
      mode: 'legacy',
    },
  };
}

async function publishLegacyProduct(args: {
  userId: string;
  sellerProfileId: string;
  title: string;
  description: string;
  category: string;
  sellingPrice: number;
  stock: number;
  images: string[];
}) {
  const productColumns = await getTableColumns('products');

  const sellerColumn = pickFirstExisting(productColumns, ['seller_id', 'sellerId']);
  const nameColumn = pickFirstExisting(productColumns, ['name', 'title']);
  const priceColumn = pickFirstExisting(productColumns, ['price', 'selling_price', 'sellingPrice']);
  const idColumn = pickFirstExisting(productColumns, ['id']);

  if (!sellerColumn || !nameColumn || !priceColumn || !idColumn) {
    throw new Error('Products table is missing one or more required columns for publish import');
  }

  const sellerIdValue = await resolveLegacySellerIdValue({
    sellerColumn,
    userId: args.userId,
    sellerProfileId: args.sellerProfileId,
  });

  const duplicate = await query(
    `SELECT ${quoteIdentifier(idColumn)} AS id
     FROM products
     WHERE ${quoteIdentifier(sellerColumn)} = $1
       AND ${quoteIdentifier(nameColumn)} = $2
     LIMIT 1`,
    [sellerIdValue, args.title]
  );

  if (duplicate.rows.length > 0) {
    return { duplicate: true as const, productId: String(duplicate.rows[0].id) };
  }

  const productId = crypto.randomUUID();
  const descriptionColumn = pickFirstExisting(productColumns, ['description']);
  const quantityColumn = pickFirstExisting(productColumns, ['quantity', 'stock']);
  const categoryColumn = pickFirstExisting(productColumns, ['category']);
  const imageColumn = pickFirstExisting(productColumns, ['image_urls', 'imageUrls', 'images']);
  const ratingColumn = pickFirstExisting(productColumns, ['rating']);
  const reviewCountColumn = pickFirstExisting(productColumns, ['num_reviews', 'numReviews']);
  const createdAtColumn = pickFirstExisting(productColumns, ['created_at', 'createdAt']);
  const updatedAtColumn = pickFirstExisting(productColumns, ['updated_at', 'updatedAt']);

  const fields: Array<{ column: string; value: unknown; cast?: string }> = [
    { column: idColumn, value: productId },
    { column: sellerColumn, value: sellerIdValue },
    { column: nameColumn, value: args.title },
    { column: priceColumn, value: args.sellingPrice },
  ];

  if (descriptionColumn) fields.push({ column: descriptionColumn, value: args.description });
  if (quantityColumn) fields.push({ column: quantityColumn, value: args.stock });
  if (categoryColumn) fields.push({ column: categoryColumn, value: args.category });
  if (imageColumn) {
    const cast = imageColumn === 'image_urls' || imageColumn === 'imageUrls' ? '::text[]' : undefined;
    fields.push({ column: imageColumn, value: args.images, cast });
  }
  if (ratingColumn) fields.push({ column: ratingColumn, value: 0 });
  if (reviewCountColumn) fields.push({ column: reviewCountColumn, value: 0 });
  if (createdAtColumn) fields.push({ column: createdAtColumn, value: new Date() });
  if (updatedAtColumn) fields.push({ column: updatedAtColumn, value: new Date() });

  const columnSql = fields.map((field) => quoteIdentifier(field.column)).join(', ');
  const valueSql = fields
    .map((field, index) => `$${index + 1}${field.cast || ''}`)
    .join(', ');

  await query(
    `INSERT INTO products (${columnSql}) VALUES (${valueSql})`,
    fields.map((field) => field.value)
  );

  return { duplicate: false as const, productId };
}

export async function POST(request: NextRequest) {
  try {
    const token =
      extractToken(request.headers.get('authorization')) ||
      request.cookies.get('nextsells_token')?.value ||
      null;
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
      profitMargin?: number;
      stock?: number;
      images?: string[];
      brand?: string;
    };

    const title = body.title?.trim();
    if (!title || typeof body.basePrice !== 'number') {
      return errorResponse('Invalid catalog product payload', 422);
    }

    const rawMargin = typeof body.profitMargin === 'number' ? body.profitMargin : 20;
    const profitMargin = Math.max(0, Math.min(100, rawMargin));
    const sellingPrice = Number((body.basePrice + (body.basePrice * profitMargin) / 100).toFixed(2));
    const externalId = body.externalId || Date.now();
    const sellerId = sellerResult.profile.sellerIdForProduct;

    if (sellerResult.profile.mode === 'legacy') {
      const images = (body.images && body.images.length > 0) ? body.images : ['/placeholder.jpg'];
      const legacyWrite = await publishLegacyProduct({
        userId: sellerResult.profile.userId,
        sellerProfileId: sellerResult.profile.sellerProfileId,
        title,
        description: body.description || '',
        category: body.category || 'Other',
        sellingPrice,
        stock: body.stock || 0,
        images,
      });

      if (legacyWrite.duplicate) {
        return errorResponse('This catalog product is already published in your store', 409);
      }

      return successResponse(
        {
          id: legacyWrite.productId,
          title,
          source: body.brand || 'Catalog Supplier',
          sellingPrice,
          isPublished: true,
        },
        'Catalog product published to your store',
        201
      );
    }

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
        images: JSON.stringify((body.images && body.images.length > 0) ? body.images : ['/placeholder.jpg']),
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