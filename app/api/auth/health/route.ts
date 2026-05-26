import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Auth0 API
 * Test if the API route structure is working
 */
export const GET = () => {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Auth API is working',
      endpoints: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        callback: '/api/auth/callback',
        me: '/api/auth/me',
      },
    },
    { status: 200 }
  );
};
