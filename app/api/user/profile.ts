let getSession: any;
try {
  const m = require('@auth0/nextjs-auth0');
  getSession = m.getSession;
} catch (e) {
  getSession = async () => null;
}
import { NextRequest, NextResponse } from 'next/server';
let prisma: any;
try {
  const m = require('@/lib/prisma');
  prisma = m.prisma || m.default;
} catch (e) {
  prisma = null;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, phone, address, picture } = body;

    // Update user profile in database
    const user = await prisma.user.update({
      where: { auth0Id: session.user.sub },
      data: {
        name: name || undefined,
        email: session.user.email,
        bio,
        phone,
        address,
        picture: picture || undefined,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        bio: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

