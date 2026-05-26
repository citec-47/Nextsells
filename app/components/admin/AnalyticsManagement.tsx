'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, DollarSign, Eye, RefreshCw, ShoppingBag, Store } from 'lucide-react';

interface Overview {
  totalRevenue: number;
  totalOrders: number;
  totalVisitors: number;
  activeStores: number;
  pendingPayouts: number;
  conversionRate: number;
}

interface MonthlyTrendPoint {
  month: string;
  orderCount: number;
  revenue: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface TopStore {
  userId: string;
  storeName: string;
  sellerName: string;
  storeLogo: string | null;
  visitors: number;
  orders: number;
  revenue: number;
}

interface AnalyticsPayload {
  overview: Overview;
  monthlyTrend: MonthlyTrendPoint[];
  orderStatus: StatusPoint[];
  topStores: TopStore[];
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function StoreAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name} className="h-10 w-10 rounded-full object-cover shrink-0" />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2140] text-xs font-bold text-white shrink-0">
      {initials || 'ST'}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="mt-2 text-sm text-gray-500">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsManagement() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => (typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await response.json();
      if (json.success) {
        setAnalytics(json.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxRevenue = useMemo(() => {
    return Math.max(...(analytics?.monthlyTrend.map((point) => point.revenue) ?? [0]), 1);
  }, [analytics]);

  const totalStatusCount = useMemo(() => {
    return analytics?.orderStatus.reduce((sum, item) => sum + item.count, 0) ?? 0;
  }, [analytics]);

  const overview = analytics?.overview;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track revenue, traffic, order mix, and the strongest-performing stores across the marketplace.
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross Revenue"
          value={formatCurrency(overview?.totalRevenue ?? 0)}
          hint="Delivered and paid orders"
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Orders Processed"
          value={formatNumber(overview?.totalOrders ?? 0)}
          hint="Marketplace-wide order volume"
          icon={<ShoppingBag size={18} />}
        />
        <StatCard
          label="Store Visitors"
          value={formatNumber(overview?.totalVisitors ?? 0)}
          hint="Combined seller traffic"
          icon={<Eye size={18} />}
        />
        <StatCard
          label="Active Stores"
          value={formatNumber(overview?.activeStores ?? 0)}
          hint={`Pending payouts ${formatCurrency(overview?.pendingPayouts ?? 0)}`}
          icon={<Store size={18} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <p className="mt-1 text-sm text-gray-500">Last six months of order revenue and volume.</p>
            </div>
            <div className="rounded-xl bg-blue-50 px-3 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Conversion</p>
              <p className="mt-1 text-xl font-bold text-blue-900">{(overview?.conversionRate ?? 0).toFixed(2)}%</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 h-64 animate-pulse rounded-2xl bg-gray-100" />
          ) : (
            <div className="mt-8 grid grid-cols-6 items-end gap-4">
              {(analytics?.monthlyTrend ?? []).map((point) => {
                const height = `${Math.max((point.revenue / maxRevenue) * 220, point.revenue > 0 ? 18 : 8)}px`;
                return (
                  <div key={point.month} className="flex flex-col items-center gap-3">
                    <div className="flex h-64 w-full items-end justify-center rounded-2xl bg-gradient-to-b from-gray-50 to-white px-2">
                      {/* eslint-disable-next-line @next/next/no-inline-styles */}
                      <div className="w-full rounded-t-2xl bg-gradient-to-b from-blue-500 to-blue-700 px-2 pb-3 pt-4 text-white shadow-sm" style={{ height }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100">Orders</p>
                        <p className="mt-1 text-sm font-bold">{formatNumber(point.orderCount)}</p>
                        <p className="mt-2 text-xs text-blue-100">{formatCurrency(point.revenue)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{point.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Order Status Mix</h2>
              <p className="mt-1 text-sm text-gray-500">How current order flow is distributed.</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-blue-600">
              <BarChart3 size={18} />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
                ))
              : (analytics?.orderStatus ?? []).map((item) => {
                  const share = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
                  return (
                    <div key={item.status} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-700">{item.status.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500">{formatNumber(item.count)} • {share.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-inline-styles */}
                        <div className="h-full rounded-full bg-[#1e2140]" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Top Performing Stores</h2>
            <p className="mt-1 text-sm text-gray-500">Highest revenue stores, with traffic and order volume alongside.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(analytics?.topStores ?? []).map((store) => (
              <div key={store.userId} className="grid grid-cols-[minmax(0,1.6fr)_140px_140px_160px] items-center gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <StoreAvatar name={store.storeName} logo={store.storeLogo} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">{store.storeName}</p>
                    <p className="truncate text-sm text-gray-500">{store.sellerName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Visitors</p>
                  <p className="mt-1 text-base font-semibold text-gray-800">{formatNumber(store.visitors)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Orders</p>
                  <p className="mt-1 text-base font-semibold text-gray-800">{formatNumber(store.orders)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Revenue</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{formatCurrency(store.revenue)}</p>
                </div>
              </div>
            ))}

            {!loading && (analytics?.topStores.length ?? 0) === 0 && (
              <div className="px-6 py-14 text-center text-sm text-gray-400">No store analytics available yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}