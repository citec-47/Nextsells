'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Store, Users, Search, RefreshCw, Ban, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

type UserRole = 'ADMIN' | 'SELLER' | 'BUYER' | string;
type FilterTab = 'all' | 'admin' | 'seller' | 'buyer' | 'blocked';

interface UserRecord {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  companyName: string | null;
  logoUrl: string | null;
  orderCount: number;
  productCount: number;
}

interface UserStats {
  total: number;
  admins: number;
  sellers: number;
  buyers: number;
  blocked: number;
  verified: number;
}

function StatCard({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-4 text-3xl font-bold tracking-tight ${valueClass || 'text-gray-900'}`}>{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className="h-10 w-10 rounded-full object-cover shrink-0" />
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
      {initials || 'U'}
    </div>
  );
}

function roleBadge(role: UserRole) {
  if (role === 'ADMIN') return 'bg-indigo-100 text-indigo-700';
  if (role === 'SELLER') return 'bg-blue-100 text-blue-700';
  if (role === 'BUYER') return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    sellers: 0,
    buyers: 0,
    blocked: 0,
    verified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [actioning, setActioning] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = () =>
    typeof window !== 'undefined' ? (localStorage.getItem('token') ?? '') : '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await response.json();
      if (json.success) {
        setUsers(json.data);
        setStats(json.stats);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleUsers = useMemo(() => {
    let list = users;

    if (tab === 'admin') list = list.filter((user) => user.role === 'ADMIN');
    if (tab === 'seller') list = list.filter((user) => user.role === 'SELLER');
    if (tab === 'buyer') list = list.filter((user) => user.role === 'BUYER');
    if (tab === 'blocked') list = list.filter((user) => user.isBlocked);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((user) =>
        [user.name, user.email, user.role, user.companyName || '']
          .some((value) => value.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [users, tab, search]);

  const tabs: Array<{ key: FilterTab; label: string; count: number }> = [
    { key: 'all', label: 'All', count: users.length },
    { key: 'admin', label: 'Admins', count: stats.admins },
    { key: 'seller', label: 'Sellers', count: stats.sellers },
    { key: 'buyer', label: 'Buyers', count: stats.buyers },
    { key: 'blocked', label: 'Blocked', count: stats.blocked },
  ];

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/users/${deleteTarget.userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleBlock = async (user: UserRecord) => {
    setActioning(user.userId);
    try {
      await fetch(`/api/admin/users/${user.userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isBlocked: !user.isBlocked }),
      });
      await load();
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all buyers, sellers, and admins in one place.</p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={stats.total} icon={<Users size={18} />} />
        <StatCard label="Sellers" value={stats.sellers} icon={<Store size={18} />} valueClass="text-blue-700" />
        <StatCard label="Admins" value={stats.admins} icon={<ShieldCheck size={18} />} valueClass="text-indigo-700" />
        <StatCard label="Blocked" value={stats.blocked} icon={<Ban size={18} />} valueClass="text-red-600" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, role, or store..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm text-gray-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === key ? 'bg-[#1e2140] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.5fr)_110px_120px_170px] gap-4 border-b border-gray-100 bg-gray-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">No users found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleUsers.map((user) => {
              const busy = actioning === user.userId;
              return (
                <div key={user.userId} className="grid grid-cols-[minmax(0,1.5fr)_110px_120px_170px] items-center gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={user.name} logoUrl={user.logoUrl} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      {user.companyName && (
                        <p className="truncate text-xs text-blue-600">{user.companyName}</p>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(user.role)}`}>
                    {user.role}
                  </span>

                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    {user.isVerified && (
                      <span className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBlock(user)}
                      disabled={busy}
                      title={user.isBlocked ? 'Unblock user' : 'Block user'}
                      className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
                        user.isBlocked
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {user.isBlocked ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      disabled={busy}
                      title="Delete user"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Delete User</h2>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to permanently delete:
            </p>
            <p className="text-sm font-semibold text-gray-900 mb-1">{deleteTarget.name}</p>
            <p className="text-xs text-gray-500 mb-4">{deleteTarget.email}</p>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3 mb-6">
              This will remove the user and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
