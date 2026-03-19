'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleDollarSign, ClipboardList, Clock3, TrendingUp, User } from 'lucide-react';

type SellerOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    subtotal: number;
  }>;
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/seller/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Please sign in with a seller account to view orders.');
          }
          throw new Error('Orders service is temporarily unavailable. Please refresh in a moment.');
        }

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to load orders');
        }
        setOrders(json.data.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const normalizeStatus = (status: string) => status.toLowerCase().trim().replace(/[_\s]+/g, '-');

  const formatStatus = (status: string) =>
    status
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const statusFilters = useMemo(() => {
    const statusCount = orders.reduce<Record<string, number>>((acc, order) => {
      const key = normalizeStatus(order.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return [
      { key: 'all', label: 'All', count: orders.length },
      { key: 'pending-to-pay', label: 'Pending', count: statusCount['pending-to-pay'] || statusCount.pending || 0 },
      { key: 'contacted-admin', label: 'Contacted Admin', count: statusCount['contacted-admin'] || 0 },
      { key: 'shipping', label: 'Shipping', count: statusCount.shipping || 0 },
      { key: 'completed', label: 'Completed', count: statusCount.completed || 0 },
      { key: 'rejected', label: 'Rejected', count: statusCount.rejected || statusCount.cancelled || 0 },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') {
      return orders;
    }
    if (activeFilter === 'rejected') {
      return orders.filter((order) => {
        const status = normalizeStatus(order.status);
        return status === 'rejected' || status === 'cancelled';
      });
    }
    if (activeFilter === 'pending-to-pay') {
      return orders.filter((order) => {
        const status = normalizeStatus(order.status);
        return status === 'pending-to-pay' || status === 'pending';
      });
    }
    return orders.filter((order) => normalizeStatus(order.status) === activeFilter);
  }, [activeFilter, orders]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingToPay = orders.filter((order) => {
      const status = normalizeStatus(order.status);
      return status === 'pending-to-pay' || status === 'pending';
    }).length;
    const completedRevenue = orders
      .filter((order) => normalizeStatus(order.status) === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const profit = completedRevenue * 0.2;

    return {
      totalOrders,
      pendingToPay,
      completedRevenue,
      profit,
    };
  }, [orders]);

  const statusTone = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'completed') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (normalized === 'shipping') {
      return 'bg-blue-100 text-blue-700';
    }
    if (normalized === 'pending-to-pay' || normalized === 'pending') {
      return 'bg-amber-100 text-amber-700';
    }
    if (normalized === 'rejected' || normalized === 'cancelled') {
      return 'bg-rose-100 text-rose-700';
    }
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">Manage incoming orders from buyers</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading orders...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No orders found yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Total Orders</p>
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                    <ClipboardList size={16} />
                  </div>
                </div>
                <p className="mt-5 text-4xl font-bold leading-none text-slate-900">{stats.totalOrders}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Pending to Pay</p>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                    <Clock3 size={16} />
                  </div>
                </div>
                <p className="mt-5 text-4xl font-bold leading-none text-amber-600">{money(0)}</p>
                <p className="mt-4 text-xs text-slate-400">Amount to pay admin</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Revenue</p>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <CircleDollarSign size={16} />
                  </div>
                </div>
                <p className="mt-5 text-4xl font-bold leading-none text-emerald-600">{money(stats.completedRevenue)}</p>
                <p className="mt-4 text-xs text-slate-400">From completed orders</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Profit</p>
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <p className="mt-5 text-4xl font-bold leading-none text-emerald-600">{money(stats.profit)}</p>
                <p className="mt-4 text-xs text-slate-400">Your margin earnings</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const isActive = filter.key === activeFilter;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-[#173b62] bg-[#173b62] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                  No orders match this filter.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.orderId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-2xl font-bold leading-tight text-slate-900 sm:text-[28px]">{order.orderNumber}</p>
                          <p className="mt-1 text-sm text-slate-600 sm:text-base">
                            {order.buyerName} - {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                            {normalizeStatus(order.status) === 'completed' ? <CheckCircle2 size={12} /> : null}
                            {formatStatus(order.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold leading-none text-[#173b62] sm:text-[30px]">{money(order.totalAmount)}</p>
                        <div className="mt-2 flex items-center justify-end gap-2 text-slate-400">
                          <ChevronDown size={16} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:text-right">
                      <div className="line-clamp-1">
                        {order.items.slice(0, 2).map((item) => item.title).join(', ')}
                        {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
