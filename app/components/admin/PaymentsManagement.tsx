'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
} from 'lucide-react';

type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface Withdrawal {
  withdrawalId: string;
  amount: number;
  status: WithdrawalStatus;
  bankAccount: string | null;
  notes: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  userId: string;
  sellerName: string;
  sellerEmail: string;
  storeName: string | null;
  storeLogo: string | null;
}

interface Stats {
  total: number;
  pending: number;
  paidOut: number;
  rejected: number;
}

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_META: Record<WithdrawalStatus, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  approved:  { label: 'Approved',  color: 'bg-green-100  text-green-700  border border-green-200'  },
  completed: { label: 'Approved',  color: 'bg-green-100  text-green-700  border border-green-200'  },
  rejected:  { label: 'Rejected',  color: 'bg-red-100    text-red-700    border border-red-200'    },
};

function InitialAvatar({ name, logo }: { name: string; logo: string | null }) {
  const letter = (name ?? '?')[0]?.toUpperCase() ?? '?';
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#1e2140] text-white text-sm font-bold flex items-center justify-center shrink-0">
      {letter}
    </div>
  );
}

export default function PaymentsManagement() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, paidOut: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setWithdrawals(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await fetch(`/api/admin/payments/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioning(id);
    try {
      await fetch(`/api/admin/payments/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
    } finally {
      setActioning(null);
    }
  };

  const filtered = useMemo(() => {
    let list = withdrawals;
    if (tab === 'pending')  list = list.filter((w) => w.status === 'pending');
    if (tab === 'approved') list = list.filter((w) => w.status === 'approved' || w.status === 'completed');
    if (tab === 'rejected') list = list.filter((w) => w.status === 'rejected');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.storeName?.toLowerCase().includes(q) ||
          w.sellerName.toLowerCase().includes(q) ||
          w.bankAccount?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [withdrawals, tab, search]);

  const fmtAmount = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage seller withdrawal requests</p>
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
          label="Total Requests"
          value={stats.total}
          icon={<DollarSign size={20} className="text-blue-500" />}
          valueClass="text-gray-900"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock size={20} className="text-orange-500" />}
          valueClass="text-orange-500"
        />
        <StatCard
          label="Total Paid Out"
          value={fmtAmount(stats.paidOut)}
          icon={<CheckCircle2 size={20} className="text-green-500" />}
          valueClass="text-green-600"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle size={20} className="text-red-500" />}
          valueClass="text-red-500"
        />
      </div>

      {/* Search + tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store, seller, or account..."
            className="w-full pl-8 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex gap-1.5">
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
      </div>

      {/* Withdrawal list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-sm text-gray-400">
            No withdrawal requests found
          </div>
        ) : (
          filtered.map((w) => {
            const meta = STATUS_META[w.status] ?? STATUS_META.pending;
            const isOpen = expanded === w.withdrawalId;
            const isBusy = actioning === w.withdrawalId;

            return (
              <div key={w.withdrawalId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : w.withdrawalId)}
                >
                  <InitialAvatar name={w.storeName ?? w.sellerName} logo={w.storeLogo} />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{fmtAmount(w.amount)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {w.storeName ?? '—'}
                      <span className="mx-1 text-gray-300">·</span>
                      {w.sellerName}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(w.requestedAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${meta.color}`}
                    >
                      {(w.status === 'approved' || w.status === 'completed') && (
                        <CheckCircle2 size={11} />
                      )}
                      {w.status === 'rejected' && <XCircle size={11} />}
                      {w.status === 'pending' && <Clock size={11} />}
                      {meta.label}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t bg-gray-50 px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Detail label="Seller" value={w.sellerName} />
                      <Detail label="Store" value={w.storeName ?? '—'} />
                      <Detail label="Email" value={w.sellerEmail} />
                      <Detail label="Bank / Account" value={w.bankAccount ?? '—'} />
                      <Detail label="Amount" value={fmtAmount(w.amount)} />
                      <Detail label="Requested" value={fmtDate(w.requestedAt)} />
                      {w.reviewedAt && <Detail label="Reviewed" value={fmtDate(w.reviewedAt)} />}
                      {w.notes && <Detail label="Notes" value={w.notes} />}
                    </div>

                    {w.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={isBusy}
                          onClick={(e) => { e.stopPropagation(); handleApprove(w.withdrawalId); }}
                          className="px-4 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={(e) => { e.stopPropagation(); handleReject(w.withdrawalId); }}
                          className="px-4 py-1.5 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
