'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

type LoanStatus = 'pending' | 'active' | 'rejected' | 'repaid';

interface Loan {
  loanId: string;
  amount: number;
  repaidAmount: number;
  purpose: string | null;
  status: LoanStatus;
  interestRate: number;
  durationMonths: number;
  requestedAt: string;
  approvedAt: string | null;
  repaidAt: string | null;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  storeName: string | null;
  storeLogo: string | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  rejected: number;
  loanedOut: number;
  totalRepaid: number;
  outstanding: number;
}

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_META: Record<LoanStatus, { label: string; color: string }> = {
  pending:  { label: 'Pending',  color: 'bg-orange-100 text-orange-700 border border-orange-200' },
  active:   { label: 'Active',   color: 'bg-blue-100 text-blue-700 border border-blue-200'     },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border border-red-200'       },
  repaid:   { label: 'Repaid',   color: 'bg-green-100 text-green-700 border border-green-200' },
};

function StoreAvatar({ name, logo }: { name: string | null; logo: string | null }) {
  const letter = (name ?? 'S')[0]?.toUpperCase() ?? 'S';
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={name ?? ''} className="w-10 h-10 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#1e2140] text-white text-sm font-bold flex items-center justify-center shrink-0">
      {letter}
    </div>
  );
}

export default function LoansManagement() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
    loanedOut: 0,
    totalRepaid: 0,
    outstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/loans', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setLoans(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Error loading loans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    setActioning(id);
    try {
      await fetch(`/api/admin/loans/${id}/approve`, {
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
      await fetch(`/api/admin/loans/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
    } finally {
      setActioning(null);
    }
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return loans;
    return loans.filter((l) => {
      if (tab === 'pending') return l.status === 'pending';
      if (tab === 'approved') return l.status === 'active';
      if (tab === 'rejected') return l.status === 'rejected';
      return true;
    });
  }, [loans, tab]);

  const fmtAmount = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',      label: `All (${stats.total})` },
    { key: 'pending',  label: `Pending (${stats.pending})` },
    { key: 'approved', label: `Approved (${stats.active})` },
    { key: 'rejected', label: `Rejected (${stats.rejected})` },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve seller loan requests</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Loaned Out"
          value={fmtAmount(stats.loanedOut)}
          icon={<DollarSign size={20} className="text-blue-500" />}
          valueClass="text-blue-600"
        />
        <StatCard
          label="Total Repaid"
          value={fmtAmount(stats.totalRepaid)}
          icon={<CheckCircle2 size={20} className="text-green-500" />}
          valueClass="text-green-600"
        />
        <StatCard
          label="Outstanding"
          value={fmtAmount(stats.outstanding)}
          icon={<TrendingUp size={20} className="text-orange-500" />}
          valueClass="text-orange-600"
        />
        <StatCard
          label="Active Loans"
          value={stats.active}
          icon={<Clock size={20} className="text-purple-500" />}
          valueClass="text-purple-600"
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          icon={<Clock size={20} className="text-red-500" />}
          valueClass="text-red-600"
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

      {/* Loan list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-sm text-gray-400">
            <div className="flex justify-center mb-3">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            No loan requests found
          </div>
        ) : (
          filtered.map((loan) => {
            const meta = STATUS_META[loan.status] ?? STATUS_META.pending;
            const isOpen = expanded === loan.loanId;
            const isBusy = actioning === loan.loanId;
            const outstanding = loan.amount - loan.repaidAmount;

            return (
              <div key={loan.loanId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : loan.loanId)}
                >
                  <StoreAvatar name={loan.storeName} logo={loan.storeLogo} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{fmtAmount(loan.amount)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium text-gray-700">{loan.storeName ?? loan.sellerName}</span>
                      <span className="mx-1 text-gray-300">·</span>
                      {loan.sellerName}
                      <span className="mx-1 text-gray-300">·</span>
                      {fmtDate(loan.requestedAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 text-sm">{fmtAmount(outstanding)}</p>
                    <p className="text-[11px] text-gray-400">Outstanding</p>
                  </div>

                  <div className="text-gray-400 shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t bg-gray-50 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <Detail label="Seller" value={loan.sellerName} />
                      <Detail label="Store" value={loan.storeName ?? '—'} />
                      <Detail label="Email" value={loan.sellerEmail} />
                      <Detail label="Amount" value={fmtAmount(loan.amount)} />
                      <Detail label="Repaid" value={fmtAmount(loan.repaidAmount)} />
                      <Detail label="Outstanding" value={fmtAmount(outstanding)} />
                      <Detail label="Duration" value={`${loan.durationMonths} months`} />
                      <Detail label="Interest Rate" value={`${loan.interestRate}%`} />
                      <Detail label="Requested" value={fmtDate(loan.requestedAt)} />
                      {loan.approvedAt && <Detail label="Approved" value={fmtDate(loan.approvedAt)} />}
                      {loan.purpose && <Detail label="Purpose" value={loan.purpose} />}
                    </div>

                    {loan.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          disabled={isBusy}
                          onClick={(e) => { e.stopPropagation(); handleApprove(loan.loanId); }}
                          className="px-4 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={(e) => { e.stopPropagation(); handleReject(loan.loanId); }}
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

function Detail({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-700 font-medium mt-0.5 truncate">{value ?? '—'}</p>
    </div>
  );
}
