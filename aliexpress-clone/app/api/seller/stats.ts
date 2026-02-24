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

    // Check if user is seller
    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!user || user.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get seller info
    const seller = await prisma.seller.findUnique({
      where: { userId: user.id },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const [totalProducts, totalOrders, pendingOrders, orders] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id } }),
      prisma.order.count({
        where: {
          items: {
            some: { product: { sellerId: seller.id } },
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'pending',
          items: {
            some: { product: { sellerId: seller.id } },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          items: {
            some: { product: { sellerId: seller.id } },
          },
        },
        include: { items: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum: number, order: any) => {
      const sellerItems = order.items.filter((item: any) => item.product.sellerId === seller.id);
      return sum + sellerItems.reduce((itemSum: number, item: any) => itemSum + item.price * item.quantity, 0);
    }, 0);

    return NextResponse.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
    });
  } catch (error) {
    console.error('Seller stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
