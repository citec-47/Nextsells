import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/utils/api';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const skip = Math.max(Number.parseInt(searchParams.get('skip') || '0', 10), 0);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || `${DEFAULT_LIMIT}`, 10);
    const limit = Number.isNaN(requestedLimit)
      ? DEFAULT_LIMIT
      : Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    const endpoint = search
      ? `https://dummyjson.com/products/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`
      : category
        ? `https://dummyjson.com/products/category/${encodeURIComponent(category)}?limit=${limit}&skip=${skip}`
        : `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;

    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return errorResponse('Failed to fetch catalog products', 502);
    }

    const payload = await response.json() as {
      products?: Array<{
        id: number;
        title: string;
        description: string;
        category: string;
        price: number;
        stock: number;
        brand?: string;
        rating?: number;
        images?: string[];
        thumbnail?: string;
      }>;
      total?: number;
      skip?: number;
      limit?: number;
    };

    const products = (payload.products || []).map((product) => ({
      externalId: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      basePrice: product.price,
      stock: product.stock,
      brand: product.brand || 'Catalog Supplier',
      rating: product.rating || 0,
      thumbnail: product.thumbnail || product.images?.[0] || '/placeholder.jpg',
      images: product.images || [],
    }));

    return successResponse({
      products,
      total: payload.total || products.length,
      skip: payload.skip || skip,
      limit: payload.limit || limit,
    });
  } catch (error) {
    console.error('Seller catalog error:', error);
    return errorResponse('Internal server error', 500);
  }
}