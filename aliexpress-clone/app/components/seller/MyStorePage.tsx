'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, ExternalLink, MapPin, Package2, ShieldCheck, Star } from 'lucide-react';
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

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
        const json = await response.json();
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
  const avatarImage = publishedProducts[1]?.image || publishedProducts[0]?.image || bannerImage;
  const displayName = user?.name || 'Seller';
  const storeBio = 'Reliable and always ready to satisfy your clients';
  const location = 'Belo, SG';

  return (
    <div className="bg-[#f8fafc] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-[#0f172a] sm:text-[24px]">My Store</h1>
            <p className="mt-1 text-sm text-slate-500">Update your storefront — images, name, and product pricing.</p>
          </div>
          <Link
            href="/seller/store"
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#173b62] bg-white px-5 py-3 text-sm font-semibold text-[#173b62] transition-colors hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            Preview Store
          </Link>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading products...</div>
        ) : error ? (
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{error}</div>
        ) : products.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No products yet. Add your first product from the Add Product page.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[28px] border border-[#e7edf5] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="relative h-[205px] overflow-hidden bg-slate-100 sm:h-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerImage} alt={storeName} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5" />
                <button
                  type="button"
                  className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur"
                >
                  <Camera size={14} />
                  Change Banner
                </button>
              </div>

              <div className="relative px-5 pb-6 pt-6 sm:px-6">
                <div className="absolute -top-10 left-5 h-20 w-20 overflow-hidden rounded-[22px] border-[5px] border-white bg-slate-100 shadow-sm sm:left-6 sm:h-24 sm:w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarImage} alt={displayName} className="h-full w-full object-cover" />
                </div>

                <div className="pl-[104px] sm:pl-[118px]">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[18px] font-bold text-[#0f172a] sm:text-[20px]">{displayName}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                      <ShieldCheck size={12} />
                      Verified
                    </span>
                  </div>
                  <p className="mt-4 max-w-xl text-[15px] text-slate-500">{storeBio}</p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-5 pl-[104px] text-sm text-slate-400 sm:pl-[118px]">
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
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[#e7edf5] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#0f172a]">Published Products</h3>
                  <p className="mt-1 text-sm text-slate-400">Hover a card to edit its profit margin or remove it from your store.</p>
                </div>
                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#edf4ff] px-3 text-sm font-bold text-[#3b82f6]">
                  {publishedProducts.length}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                  {publishedProducts.map((product, index) => {
                    const discount = 6 + ((index % 4) * 2) + (index % 2 === 0 ? 0 : 2);
                    const compareAt = product.sellingPrice / (1 - discount / 100);
                    const profit = product.sellingPrice - product.basePrice;
                    const rating = 3 + ((index % 6) * 0.3) + 0.7;

                    return (
                      <div
                        key={product.id}
                        className="group overflow-hidden rounded-[22px] border border-[#edf2f7] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                      >
                        <div className="relative rounded-t-[22px] bg-[#fbfcfe] px-5 pb-3 pt-5">
                          <span className="absolute right-4 top-4 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white">
                            -{discount}%
                          </span>
                          <div className="flex h-[170px] items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image} alt={product.title} className="h-full max-h-[150px] w-auto max-w-full object-contain" />
                          </div>
                        </div>

                        <div className="space-y-2 px-4 pb-4 pt-3">
                          <h4 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-5 text-[#0f172a]">{product.title}</h4>

                          <div className="flex items-end gap-2">
                            <span className="text-[28px] font-extrabold tracking-tight text-[#173b62]">
                              {formatMoney(product.sellingPrice)}
                            </span>
                            <span className="pb-1 text-sm text-slate-300 line-through">
                              {formatMoney(compareAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1 text-amber-500">
                              <Star size={14} fill="currentColor" />
                              <span className="text-slate-500">{rating.toFixed(1)}</span>
                            </span>
                            <span>{formatCompact(product.stock)} in stock</span>
                          </div>

                          <p className="text-[13px] font-semibold text-emerald-600">
                            ↗ +{formatMoney(profit)} ({product.profitMargin}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
