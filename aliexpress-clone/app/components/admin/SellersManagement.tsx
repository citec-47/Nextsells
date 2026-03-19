'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Eye, Star, Trash2, ChevronDown, ChevronUp, Crown } from 'lucide-react';

type SellerStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED' | string;

interface Seller {
  sellerId: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  status: SellerStatus;
  isPremium: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  logoUrl: string | null;
  productCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Active',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  NOT_STARTED: 'Inactive',
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  NOT_STARTED: 'bg-gray-100 text-gray-500',
};

function statusLabel(s: SellerStatus) {
  return STATUS_LABELS[s] ?? s;
}

function statusStyle(s: SellerStatus) {
  return STATUS_STYLES[s] ?? 'bg-gray-100 text-gray-500';
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 1)
    .join('');
  return (
    <div className="w-10 h-10 rounded-full bg-[#2d3355] flex items-center justify-center text-white font-bold text-base shrink-0">
      {initials}
    </div>
  );
}

type FilterTab = 'all' | 'active' | 'suspended' | 'pending' | 'rejected';

export default function SellersManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sellers', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setSellers(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const apiAction = async (sellerId: string, endpoint: string, method = 'POST') => {
    setActionLoading(sellerId + endpoint);
    try {
      await fetch(`/api/admin/sellers/${sellerId}${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const counts = useMemo(() => ({
    all: sellers.length,
    active: sellers.filter((s) => s.status === 'APPROVED' && !s.isBlocked).length,
    suspended: sellers.filter((s) => s.isBlocked).length,
    pending: sellers.filter((s) => s.status === 'PENDING').length,
    rejected: sellers.filter((s) => s.status === 'REJECTED').length,
  }), [sellers]);

  const premiumCount = sellers.filter((s) => s.isPremium).length;

  const filtered = useMemo(() => {
    let list = sellers;
    if (tab === 'active') list = list.filter((s) => s.status === 'APPROVED' && !s.isBlocked);
    else if (tab === 'suspended') list = list.filter((s) => s.isBlocked);
    else if (tab === 'pending') list = list.filter((s) => s.status === 'PENDING');
    else if (tab === 'rejected') list = list.filter((s) => s.status === 'REJECTED');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.userName.toLowerCase().includes(q) ||
          s.userEmail.toLowerCase().includes(q) ||
          (s.companyName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sellers, tab, search]);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'pending', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Sellers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sellers.length} sellers total</p>
        </div>
        {premiumCount > 0 && (
          <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Crown size={15} />
            Premium Sellers ({premiumCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email, or store..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              tab === key
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No sellers found</div>
        ) : (
          filtered.map((seller) => {
            const isExpanded = expanded === seller.sellerId;
            const isBusy = (key: string) => actionLoading === seller.sellerId + key;
            const displayStatus = seller.isBlocked ? 'Suspended' : statusLabel(seller.status);
            const displayStyle = seller.isBlocked ? 'bg-red-100 text-red-700' : statusStyle(seller.status);

            return (
              <div key={seller.sellerId}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <Avatar name={seller.userName} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{seller.userName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${displayStyle}`}>
                        {displayStatus}
                      </span>
                      {seller.isVerified && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Verified
                        </span>
                      )}
                      {seller.isPremium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Crown size={10} /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {seller.companyName || '—'} • {seller.productCount} product{seller.productCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      title="View"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      title={seller.isPremium ? 'Remove premium' : 'Make premium'}
                      onClick={() => apiAction(seller.sellerId, '/premium')}
                      disabled={!!isBusy('/premium')}
                      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                        seller.isPremium
                          ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                    >
                      <Star size={15} fill={seller.isPremium ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      title="Delete seller"
                      onClick={() => {
                        if (confirm(`Delete ${seller.userName}? This cannot be undone.`)) {
                          apiAction(seller.sellerId, '', 'DELETE');
                        }
                      }}
                      disabled={!!isBusy('')}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : seller.sellerId)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-0 bg-gray-50 border-t border-gray-100">
                    <div className="flex flex-wrap gap-6 pt-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-gray-700">{seller.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Store</p>
                        <p className="text-gray-700">{seller.companyName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Joined</p>
                        <p className="text-gray-700">
                          {new Date(seller.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Products</p>
                        <p className="text-gray-700">{seller.productCount}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {seller.isBlocked ? (
                        <button
                          onClick={() => apiAction(seller.sellerId, '/activate')}
                          disabled={!!isBusy('/activate')}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => apiAction(seller.sellerId, '/suspend')}
                          disabled={!!isBusy('/suspend')}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      {seller.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => apiAction(seller.sellerId, '/approve')}
                            disabled={!!isBusy('/approve')}
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => apiAction(seller.sellerId, '/reject')}
                            disabled={!!isBusy('/reject')}
                            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
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
