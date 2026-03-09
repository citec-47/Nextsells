import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const ROLE_CLAIM = 'https://nextsells.example/roles';

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);

    if (!session?.user) {
      console.log('[AUTH /me] No active session');
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const roles = (session.user[ROLE_CLAIM] as string[] | undefined) || [];
    
    console.log('[AUTH /me] Session found for:', session.user.email);
    console.log('[AUTH /me] User roles:', roles);
    console.log('[AUTH /me] Full session:', JSON.stringify(session.user, null, 2));
    
    return NextResponse.json({ 
      user: session.user,
      debug: {
        email: session.user.email,
        roles: roles,
        hasSellerRole: roles.includes('seller'),
        hasAdminRole: roles.includes('admin'),
        hasBuyerRole: roles.includes('buyer'),
        allClaims: Object.keys(session.user)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[AUTH /me ERROR]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
