import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const destination = new URL('/api/auth/login', url.origin);

  if (url.search) {
    destination.search = url.search;
  }

  return NextResponse.redirect(destination);
}
