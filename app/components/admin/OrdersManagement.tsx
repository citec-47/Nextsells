'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface Order {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  paymentId: string | null;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string | null;
  sellerLogo: string | null;
  sellerPremium: boolean;
}

interface Stats {
  total: number;
  needsAction: number;
  completed: number;
  revenue: number;
}

type Tab = 'all' | 'pending' | 'awaiting' | 'shipping' | 'completed' | 'rejected';

const STATUS_DISPLAY: Record<OrderStatus, { label: string; color: string; tab: Tab }> = {
  PENDING:    { label: 'Pending',              color: 'bg-gray-100 text-gray-700',    tab: 'pending' },
  CONFIRMED:  { label: 'Pending',              color: 'bg-gray-100 text-gray-700',    tab: 'pending' },
  PAID:       { label: 'Awaiting Verification', color: 'bg-orange-100 text-orange-700', tab: 'awaiting' },
  PROCESSING: { label: 'Awaiting Verification', color: 'bg-orange-100 text-orange-700', tab: 'awaiting' },
  SHIPPED:    { label: 'Shipping',             color: 'bg-blue-100 text-blue-700',    tab: 'shipping' },
  DELIVERED:  { label: 'Completed',            color: 'bg-green-100 text-green-700',  tab: 'completed' },
  CANCELLED:  { label: 'Rejected',             color: 'bg-red-100 text-red-700',      tab: 'rejected' },
};

function SellerAvatar({ name, logo }: { name: string | null; logo: string | null }) {
  const initials = (name ?? '?')
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name ?? ''} className="w-10 h-10 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#1e2140] text-white text-xs font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, needsAction: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: orders.length, pending: 0, awaiting: 0, shipping: 0, completed: 0, rejected: 0 };
    orders.forEach((o) => {
      const t = STATUS_DISPLAY[o.status]?.tab;
      if (t) c[t]++;
    });
    return c;
  }, [orders]);

  const visible = useMemo(
    () => (tab === 'all' ? orders : orders.filter((o) => STATUS_DISPLAY[o.status]?.tab === tab)),
    [orders, tab],
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',       label: `All (${counts.all})` },
    { key: 'pending',   label: `Pending (${counts.pending})` },
    { key: 'awaiting',  label: `Awaiting Verification (${counts.awaiting})` },
    { key: 'shipping',  label: `Shipping (${counts.shipping})` },
    { key: 'completed', label: `Completed (${counts.completed})` },
    { key: 'rejected',  label: `Rejected (${counts.rejected})` },
  ];

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

  const fmtAmount = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Verify payments and manage all marketplace orders</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={<ShoppingBag size={20} className="text-blue-500" />}
          valueClass="text-gray-900"
        />
        <StatCard
          label="Needs Action"
          value={stats.needsAction}
          icon={<Clock size={20} className="text-orange-500" />}
          valueClass="text-orange-500"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 size={20} className="text-green-500" />}
          valueClass="text-green-500"
        />
        <StatCard
          label="Total Revenue"
          value={fmtAmount(stats.revenue)}
          icon={<DollarSign size={20} className="text-green-500" />}
          valueClass="text-green-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-[#1e2140] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-sm text-gray-400">
            No orders found
          </div>
        ) : (
          visible.map((order) => {
            const { label, color } = STATUS_DISPLAY[order.status] ?? {
              label: order.status,
              color: 'bg-gray-100 text-gray-700',
            };
            const isOpen = expanded === order.orderId;

            return (
              <div key={order.orderId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : order.orderId)}
                >
                  <SellerAvatar name={order.sellerName} logo={order.sellerLogo} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
                        {order.status === 'SHIPPED' && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <rect x="1" y="3" width="15" height="13" rx="1" />
                            <path d="M16 8h4l3 5v3h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                          </svg>
                        )}
                        {order.status === 'DELIVERED' && <CheckCircle2 size={10} />}
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.sellerName ? (
                        <>
                          <span className="font-medium text-gray-700">{order.sellerName}</span>
                          <span className="mx-1 text-gray-300">·</span>
                        </>
                      ) : null}
                      {order.buyerName}
                      <span className="mx-1 text-gray-300">·</span>
                      {fmtDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{fmtAmount(order.totalAmount)}</p>
                    {order.paymentId && (
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                        {order.paymentId.split('_')[0] || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div className="text-gray-400 shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t bg-gray-50 px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <Detail label="Order ID" value={order.orderNumber} />
                    <Detail label="Buyer" value={`${order.buyerName} (${order.buyerEmail})`} />
                    <Detail label="Seller" value={order.sellerName ?? '—'} />
                    <Detail label="Status" value={label} />
                    <Detail label="Total" value={fmtAmount(order.totalAmount)} />
                    <Detail label="Date" value={fmtDate(order.createdAt)} />
                    {order.paymentId && <Detail label="Payment Ref" value={order.paymentId} />}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  valueClass: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-2">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <div className="mt-0.5">{icon}</div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-700 font-medium mt-0.5 truncate">{value}</p>
    </div>
  );
}
