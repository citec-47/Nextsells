/**
 * Protected API Route Example
 * Located at: app/api/profile/route.ts
 * 
 * Example API route that requires Auth0 authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getAuth0Session } from '@/lib/auth/auth0Server';

export const GET = withApiAuthRequired(async (req: NextRequest) => {
  try {
    // Get the Auth0 session
    const session = await getAuth0Session();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return user information from Auth0
    return NextResponse.json(
      {
        user: {
          id: session.user.sub,
          email: session.user.email,
          name: session.user.name,
          picture: session.user.picture,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
