import { auth0 } from './lib/auth0';

export async function proxy(request: Request) {
  const url = new URL(request.url);
  
  // Log authentication proxy requests for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PROXY] ${request.method} ${url.pathname}`);
  }

  try {
    const response = await auth0.middleware(request);
    
    // Log authentication events
    if (url.pathname.startsWith('/api/auth/')) {
      console.log(`[AUTH FLOW] ${url.pathname} - Status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('[PROXY ERROR]', error);
    throw error;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
