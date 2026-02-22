'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse, validateRequired, validationError } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/seller/products
 * Create a new product listing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'SELLER') {
      return errorResponse('Seller access required', 403);
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: payload.userId },
    });

    if (!sellerProfile) {
      return errorResponse('Seller profile not found', 404);
    }

    if (sellerProfile.status !== 'APPROVED') {
      return errorResponse(
        'Your seller profile must be approved before listing products',
        403
      );
    }

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const basePrice = parseFloat(formData.get('basePrice') as string);
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const profitMargin = parseFloat(formData.get('profitMargin') as string);
    const stock = parseInt(formData.get('stock') as string);
    const sku = formData.get('sku') as string;

    // Validate required fields
    const requiredErrors = validateRequired(
      { title, basePrice: basePrice.toString(), stock: stock.toString() },
      ['title', 'basePrice', 'stock']
    );

    if (requiredErrors) {
      return validationError(requiredErrors);
    }

    // Handle file uploads
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: string[] = [];

    // TODO: Upload files to cloud storage (S3, Cloudinary, etc.)
    // For now, use placeholder URLs
    for (let i = 0; i < imageFiles.length; i++) {
      imageUrls.push(`/uploads/products/${imageFiles[i].name}`);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description: description || '',
        category,
        basePrice,
        sellingPrice,
        profitMargin,
        stock,
        sku: sku || undefined,
        images: imageUrls,
        isPublished: true,
        sellerId: sellerProfile.id,
      },
    });

    return successResponse(
      {
        id: product.id,
        title: product.title,
        sellingPrice: product.sellingPrice,
        profitMargin: product.profitMargin,
      },
      'Product created successfully',
      201
    );
  } catch (error) {
    console.error('Product creation error:', error);
    return errorResponse('Internal server error', 500);
  }
}
