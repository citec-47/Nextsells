import { NextResponse } from 'next/server';

let getSession: any;
try {
  const auth0Module = require('@auth0/nextjs-auth0');
  getSession = auth0Module.getSession;
} catch (e) {
  getSession = async () => null;
}

let prisma: any;
try {
  const prismaModule = require('@/lib/prisma');
  prisma = prismaModule.prisma || prismaModule.default;
} catch (e) {
  prisma = null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [totalUsers, totalSellers, pendingApprovals, totalProducts] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'seller' } }),
      prisma.seller.count({ where: { status: 'pending' } }),
      prisma.product.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalSellers,
      pendingApprovals,
      totalProducts,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
