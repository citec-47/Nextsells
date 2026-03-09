import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  try {
    console.log('[AUTH] Login initiated');
    // Let the Auth0 middleware handle the login flow
    const response = await auth0.middleware(req);
    console.log('[AUTH] Login redirect prepared');
    return response;
  } catch (error) {
    console.error('[AUTH ERROR] Login failed:', error);
    throw error;
  }
}

