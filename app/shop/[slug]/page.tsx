import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseImageList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // fallback below
  }

  return raw ? [raw] : [];
}

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const normalizedSlug = String(slug || '').trim().toLowerCase();

  if (!normalizedSlug) {
    notFound();
  }

  const sellers = await prisma.sellerProfile.findMany({
    where: {
      status: 'APPROVED',
    },
    select: {
      id: true,
      companyName: true,
      bio: true,
      banner: true,
      logo: true,
    },
  });

  const seller = sellers.find((row) => toSlug(row.companyName || '') === normalizedSlug);
  if (!seller) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      sellerId: seller.id,
      isPublished: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      sellingPrice: true,
      images: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-48 w-full bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seller.banner || '/placeholder-store.svg'} alt={seller.companyName} className="h-full w-full object-cover" />
          </div>
          <div className="flex items-start gap-4 px-5 py-4">
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seller.logo || '/placeholder-store.svg'} alt={seller.companyName} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{seller.companyName}</h1>
              <p className="mt-1 text-sm text-slate-600">{seller.bio || 'Welcome to our store.'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              This store has no published products yet.
            </div>
          ) : (
            products.map((product) => {
              const images = parseImageList(product.images);
              const image = images[0] || '/placeholder.jpg';
              return (
                <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={product.title} className="h-44 w-full object-cover" />
                  <div className="space-y-1 p-4">
                    <h2 className="line-clamp-1 text-sm font-semibold text-slate-900">{product.title}</h2>
                    <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                    <p className="pt-2 text-base font-bold text-[#173b62]">${product.sellingPrice.toFixed(2)}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
