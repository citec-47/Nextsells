import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  try {
    console.log('[AUTH] Logout initiated');
    const response = await auth0.middleware(req);
    console.log('[AUTH] Logout completed');
    return response;
  } catch (error) {
    console.error('[AUTH ERROR] Logout failed:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[AUTH] Logout initiated (POST)');
    return await auth0.middleware(req);
  } catch (error) {
    console.error('[AUTH ERROR] Logout failed:', error);
    throw error;
  }
}

