import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(new URL('/', process.env.AUTH0_BASE_URL || 'http://localhost:3000'));
  res.cookies.set('nextsells_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('nextsells_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

