'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Camera, ExternalLink, MapPin, Package2, ShieldCheck } from 'lucide-react';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { useImageUpload } from '@/lib/hooks/useImageUpload';

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
    banner?: string | null;
    logo?: string | null;
    bio?: string | null;
    products?: StoreProduct[];
  };
};

const STORE_PLACEHOLDER_IMAGE = '/placeholder-store.svg';

function withCacheBust(url: string) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

type StoreCustomization = {
  banner: string;
  logo: string;
  bio: string;
};

function sameCustomization(a: StoreCustomization, b: StoreCustomization) {
  return a.banner === b.banner && a.logo === b.logo && a.bio.trim() === b.bio.trim();
}

function toStoreSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function MyStorePage() {
  const { user } = useAuth0User();
  const [storeName, setStoreName] = useState('My Store');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [savedCustomization, setSavedCustomization] = useState<StoreCustomization>({
    banner: '',
    logo: '',
    bio: 'Reliable and always ready to satisfy your clients',
  });
  const [draftCustomization, setDraftCustomization] = useState<StoreCustomization>({
    banner: '',
    logo: '',
    bio: 'Reliable and always ready to satisfy your clients',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { uploadImage, isUploading } = useImageUpload();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const persistStoreCustomization = async (payload: {
    banner?: string;
    logo?: string;
    bio?: string;
  }) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/seller/store', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();

    if (!contentType.includes('application/json')) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      throw new Error('Store customization service returned an invalid response.');
    }

    let json: StoreProductsResponse;
    try {
      json = JSON.parse(raw) as StoreProductsResponse;
    } catch {
      throw new Error('Failed to parse store customization response.');
    }

    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Failed to update store customization');
    }

    const nextSaved: StoreCustomization = {
      banner: json.data?.banner || '',
      logo: json.data?.logo || '',
      bio: json.data?.bio || 'Reliable and always ready to satisfy your clients',
    };

    setSavedCustomization(nextSaved);
    setDraftCustomization(nextSaved);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [storeResponse, productsResponse] = await Promise.all([
          fetch('/api/seller/store', { headers }),
          fetch('/api/seller/products', { headers }),
        ]);

        const parseJsonResponse = async (response: Response, invalidMessage: string) => {
          const contentType = response.headers.get('content-type') || '';
          const raw = await response.text();

          if (!contentType.includes('application/json')) {
            if (response.status === 401 || response.status === 403) {
              throw new Error('Your session has expired. Please sign in again.');
            }
            throw new Error(invalidMessage);
          }

          try {
            return JSON.parse(raw) as StoreProductsResponse;
          } catch {
            throw new Error('Failed to parse store data response.');
          }
        };

        const [storeJson, productsJson] = await Promise.all([
          parseJsonResponse(storeResponse, 'Store customization service returned an invalid response.'),
          parseJsonResponse(productsResponse, 'Store products service returned an invalid response.'),
        ]);

        if (!storeResponse.ok || !storeJson.success) {
          throw new Error(storeJson.error || 'Failed to load store customization');
        }

        if (!productsResponse.ok || !productsJson.success) {
          throw new Error(productsJson.error || 'Failed to load store products');
        }

        setStoreName(storeJson.data?.storeName || 'My Store');
        const initialCustomization: StoreCustomization = {
          banner: storeJson.data?.banner || '',
          logo: storeJson.data?.logo || '',
          bio: storeJson.data?.bio || 'Reliable and always ready to satisfy your clients',
        };

        setSavedCustomization(initialCustomization);
        setDraftCustomization(initialCustomization);
        setProducts(productsJson.data?.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load store products');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const onSelectCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setIsSaving(true);
      const uploaded = await uploadImage(file, 'logos');
      if (!uploaded) {
        throw new Error('Failed to upload cover image');
      }

      const previewUrl = withCacheBust(uploaded.url);
      setDraftCustomization((current) => ({ ...current, banner: previewUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cover image');
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const onSelectProfile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setIsSaving(true);
      const uploaded = await uploadImage(file, 'logos');
      if (!uploaded) {
        throw new Error('Failed to upload profile image');
      }

      const previewUrl = withCacheBust(uploaded.url);
      setDraftCustomization((current) => ({ ...current, logo: previewUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile image');
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  const onSaveChanges = async () => {
    try {
      setError('');
      setIsSaving(true);

      await persistStoreCustomization({
        banner: draftCustomization.banner,
        logo: draftCustomization.logo,
        bio: draftCustomization.bio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save store changes');
    } finally {
      setIsSaving(false);
    }
  };

  const onDiscardChanges = () => {
    setError('');
    setDraftCustomization(savedCustomization);
  };

  const publishedProducts = products.filter((product) => product.isPublished);
  const hasUnsavedChanges = !sameCustomization(draftCustomization, savedCustomization);
  const bannerImage =
    draftCustomization.banner ||
    publishedProducts[0]?.image ||
    products[0]?.image ||
    STORE_PLACEHOLDER_IMAGE;
  const avatarImage =
    draftCustomization.logo ||
    user?.picture ||
    publishedProducts[1]?.image ||
    publishedProducts[0]?.image ||
    STORE_PLACEHOLDER_IMAGE;
  const displayName = user?.name || storeName || 'Seller';
  const location = 'Belo, SG';
  const previewSlug = toStoreSlug(storeName || displayName);
  const previewHref = previewSlug ? `/shop/${previewSlug}` : '/shop';

  return (
    <div className="bg-[#f1f3f8] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1220px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-[#0f2b4f] sm:text-[38px]">My Store</h1>
            <p className="mt-1 text-base text-slate-500 sm:text-lg">Update your storefront - images, name, and product pricing.</p>
          </div>
          <Link
            href={previewHref}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#173b62] bg-white px-5 py-3 text-sm font-semibold text-[#173b62] transition-colors hover:bg-slate-50"
          >
            <ExternalLink size={16} />
            Preview Store
          </Link>
        </div>

        <section className="overflow-hidden rounded-[22px] border border-[#dce4ef] bg-white shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
          <div className="relative h-[250px] w-full overflow-hidden bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerImage} alt={storeName} className="h-full w-full object-cover" />
            {hasUnsavedChanges && (
              <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                Unsaved preview
              </span>
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading || isSaving}
              className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black disabled:opacity-60"
            >
              <Camera size={13} />
              Change Banner
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectCover}
            />
          </div>

          <div className="relative border-b border-slate-200 px-6 pb-6 pt-5 md:px-8">
            <div className="absolute -top-10 left-6 h-[84px] w-[84px] overflow-hidden rounded-[18px] border-4 border-white bg-white md:left-8 md:h-[88px] md:w-[88px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarImage} alt={displayName} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                disabled={isUploading || isSaving}
                className="absolute bottom-1 right-1 rounded-full bg-black/75 p-1 text-white hover:bg-black disabled:opacity-60"
                aria-label="Change profile picture"
                title="Change profile picture"
              >
                <Camera size={10} />
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectProfile}
              />
            </div>

            <div className="pl-[104px] pt-1 md:pl-[112px]">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[34px] font-bold leading-tight tracking-tight text-[#0f2b4f] sm:text-[40px]">{displayName}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-[#2563eb]">
                  <ShieldCheck size={13} />
                  Verified
                </span>
              </div>

              <div className="mt-3 max-w-[820px]">
                <textarea
                  value={draftCustomization.bio}
                  onChange={(event) =>
                    setDraftCustomization((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  maxLength={300}
                  className="w-full resize-none rounded-md border border-transparent bg-transparent p-0 text-[17px] leading-[1.5] text-[#334155] outline-none focus:border-slate-200"
                  rows={2}
                />
                <div className="mt-1 text-right text-xs text-slate-400">{draftCustomization.bio.length}/300</div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[#6b7280]">
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

          {hasUnsavedChanges && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertCircle size={15} />
                You have unsaved changes
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onDiscardChanges}
                  disabled={isSaving}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={onSaveChanges}
                  disabled={isSaving}
                  className="rounded-full bg-[#1f456d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a3960] disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading products...
          </div>
        ) : error ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : products.length === 0 ? (
          <div className="mt-5 rounded-[22px] border border-slate-200 bg-white p-6 text-sm text-slate-600">No products yet.</div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-[#dce4ef] bg-white px-5 pb-7 pt-6 shadow-[0_10px_34px_rgba(15,23,42,0.08)] sm:px-6">
            <section>
              <h3 className="text-[22px] font-bold tracking-tight text-[#0f2b4f]">
                Published Products <span className="text-[#6b7280]">({publishedProducts.length})</span>
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
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

        {(isUploading || isSaving) && (
          <div className="px-6 pb-3 text-xs text-slate-500 md:px-8">Saving store customization...</div>
        )}
      </div>
    </div>
  );
}
