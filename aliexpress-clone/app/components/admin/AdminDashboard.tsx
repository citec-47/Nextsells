'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Settings,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  pendingApprovals: number;
  totalOrders: number;
  revenue: number;
  pendingWithdrawals: number;
}

interface PendingSeller {
  requestId: string;
  sellerId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  createdAt: string;
}



const STAT_CARDS = (stats: Stats) => [
  { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50', Icon: Users },
  { label: 'Sellers', value: stats.totalSellers, color: 'text-orange-600', bg: 'bg-orange-50', Icon: Store },
  { label: 'Buyers', value: stats.totalBuyers, color: 'text-green-600', bg: 'bg-green-50', Icon: ShoppingCart },
  { label: 'Pending Approval', value: stats.pendingApprovals, color: 'text-red-600', bg: 'bg-red-50', Icon: AlertCircle },
  { label: 'Total Orders', value: stats.totalOrders, color: 'text-teal-600', bg: 'bg-teal-50', Icon: Package },
  {
    label: 'Revenue',
    value: `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    Icon: DollarSign,
  },
  { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-amber-600', bg: 'bg-amber-50', Icon: TrendingUp },
];

const QUICK_ACTIONS = [
  { label: 'Manage Sellers', href: '/admin/sellers', color: 'bg-purple-500', Icon: Store },
  { label: 'All Orders', href: '/admin/orders', color: 'bg-blue-500', Icon: ShoppingCart },
  { label: 'Withdrawals', href: '/admin/payments', color: 'bg-orange-500', Icon: CreditCard },
  { label: 'Messages', href: '/admin/messages', color: 'bg-sky-500', Icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', color: 'bg-teal-500', Icon: Settings },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('nextsells_user');
      if (userStr) setAdminName(JSON.parse(userStr)?.name ?? 'Admin');
    } catch {}
    loadData();
  }, []);

  const getToken = () => localStorage.getItem('token') ?? '';

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [statsRes, sellersRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/sellers/pending', { headers }),
      ]);
      const [statsData, sellersData] = await Promise.all([statsRes.json(), sellersRes.json()]);
      if (statsData.success) setStats(statsData.data);
      if (sellersData.success) setPendingSellers(sellersData.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    const res = await fetch(`/api/admin/sellers/${requestId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if ((await res.json()).success) loadData();
  };

  const handleReject = async (requestId: string) => {
    const res = await fetch(`/api/admin/sellers/${requestId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Rejected by admin' }),
    });
    if ((await res.json()).success) loadData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-base font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Welcome back, {adminName}. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 h-24 animate-pulse" />
            ))
          : stats &&
            STAT_CARDS(stats).map(({ label, value, color, bg, Icon }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap gap-8">
          {QUICK_ACTIONS.map(({ label, href, color, Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 group">
              <div
                className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shadow group-hover:opacity-90 transition-opacity`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <span className="text-xs text-gray-600 text-center whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending seller applications */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800 text-sm">Pending Seller Applications</h2>
          </div>
          <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
            {pendingSellers.length} pending
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div>
        ) : pendingSellers.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No pending applications</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Seller</th>
                  <th className="text-left px-5 py-3">Store</th>
                  <th className="text-left px-5 py-3">Registered</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingSellers.map((s) => (
                  <tr key={s.requestId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{s.userName}</p>
                      <p className="text-gray-400 text-xs">{s.userEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{s.companyName || '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(s.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(s.requestId)}
                          className="px-3 py-1 rounded text-xs bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(s.requestId)}
                          className="px-3 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
