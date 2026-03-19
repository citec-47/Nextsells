'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, RefreshCw, Search, Save } from 'lucide-react';

interface VisitorRow {
  sellerProfileId: string;
  userId: string;
  storeName: string;
  sellerName: string;
  sellerEmail: string;
  storeLogo: string | null;
  visitorCount: number;
  createdAt: string;
}

interface VisitorStats {
  totalStores: number;
  totalVisitors: number;
}

function StoreAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name} className="h-11 w-11 rounded-full object-cover shrink-0" />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e2140] text-xs font-bold text-white">
      {initials || 'ST'}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function VisitorsManagement() {
  const [stores, setStores] = useState<VisitorRow[]>([]);
  const [stats, setStats] = useState<VisitorStats>({ totalStores: 0, totalVisitors: 0 });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const getToken = () => (typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/visitors', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await response.json();
      if (json.success) {
        setStores(json.data);
        setStats(json.stats);
        setDrafts(
          Object.fromEntries(
            (json.data as VisitorRow[]).map((store) => [store.userId, String(store.visitorCount)]),
          ),
        );
      }
    } catch (error) {
      console.error('Error loading visitor counts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleStores = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return stores;
    }

    return stores.filter((store) =>
      [store.storeName, store.sellerName, store.sellerEmail].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [stores, search]);

  const formatNumber = (value: number) => value.toLocaleString('en-US');

  const handleSave = async (userId: string) => {
    const nextValue = Number(drafts[userId] ?? 0);
    if (!Number.isInteger(nextValue) || nextValue < 0) {
      return;
    }

    setSavingId(userId);
    try {
      const response = await fetch('/api/admin/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ userId, visitorCount: nextValue }),
      });

      const json = await response.json();
      if (json.success) {
        setStores((current) =>
          current.map((store) =>
            store.userId === userId
              ? { ...store, visitorCount: json.data.visitorCount }
              : store,
          ),
        );
        setStats((current) => {
          const totalVisitors = stores.reduce((sum, store) => {
            if (store.userId === userId) {
              return sum + json.data.visitorCount;
            }
            return sum + store.visitorCount;
          }, 0);
          return { ...current, totalVisitors };
        });
      }
    } catch (error) {
      console.error('Error saving visitor count:', error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Store Visitors</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set the visitor count displayed on each seller&apos;s dashboard and store.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total Stores" value={formatNumber(stats.totalStores)} icon={<Eye size={18} />} />
        <StatCard label="Total Visitors" value={formatNumber(stats.totalVisitors)} icon={<Eye size={18} />} />
      </div>

      <div className="max-w-sm">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by store or seller..."
            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.5fr)_170px_120px] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <span>Store</span>
          <span>Visitors</span>
          <span>Action</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : visibleStores.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-gray-400">No stores found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleStores.map((store) => {
              const draftValue = drafts[store.userId] ?? String(store.visitorCount);
              const saveDisabled =
                savingId === store.userId ||
                draftValue === String(store.visitorCount) ||
                draftValue.trim() === '' ||
                Number(draftValue) < 0;

              return (
                <div
                  key={store.sellerProfileId}
                  className="grid grid-cols-[minmax(0,1.5fr)_170px_120px] items-center gap-4 px-6 py-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <StoreAvatar name={store.storeName} logo={store.storeLogo} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-gray-900">{store.storeName}</p>
                      <p className="truncate text-sm text-gray-500">{store.sellerName}</p>
                    </div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={draftValue}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [store.userId]: event.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border border-gray-200 px-4 text-center text-lg font-medium text-gray-800 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />

                  <button
                    onClick={() => handleSave(store.userId)}
                    disabled={saveDisabled}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-400 px-4 text-sm font-semibold text-white transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} />
                    Save
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}