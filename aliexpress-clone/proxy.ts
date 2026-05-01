import { NextResponse } from 'next/server';

export async function proxy(request: Request) {
  const url = new URL(request.url);
  
  // Log authentication proxy requests for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PROXY] ${request.method} ${url.pathname}`);
  }

  // Do not run auth middleware in proxy. Auth routes are handled by their own
  // route handlers under app/api/auth/* and should not be short-circuited here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
