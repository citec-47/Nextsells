import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.error('[AUTH CALLBACK] Auth0 error:', {
        error,
        description: errorDescription,
      });
    } else if (code) {
      console.log('[AUTH CALLBACK] Authorization code received, exchanging for tokens');
    }

    // Let the Auth0 middleware handle the callback
    const response = await auth0.middleware(req);
    console.log('[AUTH CALLBACK] Callback processed successfully');
    return response;
  } catch (error) {
    console.error('[AUTH CALLBACK ERROR] Failed to process callback:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[AUTH CALLBACK] POST request received');
    return await auth0.middleware(req);
  } catch (error) {
    console.error('[AUTH CALLBACK ERROR] Failed to process callback:', error);
    throw error;
  }
}

