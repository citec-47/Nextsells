'use client';

import { useEffect, useState } from 'react';
import { MapPin, Package2, ShieldCheck } from 'lucide-react';
import { useAuth0User } from '@/lib/auth/auth0Client';

type StoreProduct = {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  sellingPrice: number;
  profitMargin: number;
  stock: number;
  isPublished: boolean;
  image: string;
  createdAt: string;
};

type StoreProductsResponse = {
  success: boolean;
  error?: string;
  data?: {
    storeName?: string;
    products?: StoreProduct[];
  };
};

export default function MyStorePage() {
  const { user } = useAuth0User();
  const [storeName, setStoreName] = useState('My Store');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/seller/products', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const contentType = response.headers.get('content-type') || '';
        const raw = await response.text();

        if (!contentType.includes('application/json')) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Your session has expired. Please sign in again.');
          }
          throw new Error('Store service returned an invalid response.');
        }

        let json: StoreProductsResponse;
        try {
          json = JSON.parse(raw) as StoreProductsResponse;
        } catch {
          throw new Error('Failed to parse store data response.');
        }

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to load store products');
        }

        setStoreName(json.data.storeName || 'My Store');
        setProducts(json.data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load store products');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const publishedProducts = products.filter((product) => product.isPublished);
  const bannerImage = publishedProducts[0]?.image || products[0]?.image || '/placeholder.jpg';
  const avatarImage = user?.picture || publishedProducts[1]?.image || publishedProducts[0]?.image || bannerImage;
  const displayName = user?.name || storeName || 'Seller';
  const storeBio = 'Reliable and always ready to satisfy your clients';
  const location = 'Belo, SG';

  return (
    <div className="bg-[#f1f3f8]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="bg-white">
          <div className="relative h-[220px] w-full overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerImage} alt={storeName} className="h-full w-full object-cover" />
          </div>

          <div className="relative border-b border-slate-200 px-6 pb-5 pt-4 md:px-8">
            <div className="absolute -top-38 left-6 h-[82px] w-[82px] overflow-hidden rounded-[18px] border-4 border-white bg-white md:left-8 md:h-[86px] md:w-[86px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarImage} alt={displayName} className="h-full w-full object-cover" />
            </div>

            <div className="pl-[102px]">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[39px] font-bold leading-none tracking-tight text-[#0f2b4f]">{displayName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full text-[13px] font-semibold text-[#2563eb]">
                  <ShieldCheck size={13} />
                  Verified
                </span>
              </div>

              <p className="mt-3 text-[33px] leading-[1.15] text-[#334155]">{storeBio}</p>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-[27px] text-[#6b7280]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} />
                  {location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package2 size={14} />
                  {publishedProducts.length} products
                </span>
                <span>by {displayName}</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-[#f1f3f8] px-6 py-8 md:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading products...</div>
          </div>
        ) : error ? (
          <div className="bg-[#f1f3f8] px-6 py-8 md:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-[#f1f3f8] px-6 py-8 md:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No products yet.</div>
          </div>
        ) : (
          <div className="bg-[#f1f3f8] px-6 pb-10 pt-8 md:px-8">
            <section>
              <h2 className="text-[38px] font-extrabold tracking-tight text-[#0f2b4f]">
                Products <span className="text-[#6b7280]">({publishedProducts.length})</span>
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {publishedProducts.map((product) => (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[16px] border border-[#d8dde8] bg-[#eef1f6]"
                  >
                    <div className="flex h-[245px] items-end justify-center bg-[#eef1f6] p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
