'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  Plus,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  BarChart3,
  LogOut,
  TrendingUp,
  Package,
  Wallet,
  Eye,
  CheckCircle2,
  HandCoins,
  Receipt,
  Clock3,
  Bell,
  Shield,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { usePlatformBrand } from '@/app/hooks/usePlatformBrand';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  publishedProducts: number;
  availableBalance: number;
  storeVisitors: number;
}

type RangeKey = '7D' | '30D' | '90D' | 'ALL';

function getStatusLabel(status: string) {
  if (status === 'APPROVED') return 'Active';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'PENDING_REVIEW') return 'Pending';
  return status || 'Unknown';
}

function getStatusTone(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth0User();
  const { platformName } = usePlatformBrand();
  const [storeName, setStoreName] = useState('');
  const [storeStatus, setStoreStatus] = useState('');
  const [activeRange, setActiveRange] = useState<RangeKey>('30D');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch('/api/seller/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch stats');
        }
        setStoreName(data.storeName || '');
        setStoreStatus(data.status || '');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/seller/dashboard', active: true },
    { icon: Store, label: 'My Store', href: '/seller/store' },
    { icon: Plus, label: 'Add Products', href: '/seller/products' },
    { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
    { icon: CreditCard, label: 'Payments', href: '/seller/payments' },
    { icon: MessageSquare, label: 'Messages', href: '/seller/messages' },
  ];

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const fullMoney = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const quickActions = [
    { icon: Plus, label: 'Add Product', href: '/seller/products', tone: 'bg-blue-600' },
    { icon: ShoppingCart, label: 'View Orders', href: '/seller/orders', tone: 'bg-violet-600' },
    { icon: HandCoins, label: 'Withdraw', href: '/seller/payments', tone: 'bg-teal-600' },
    { icon: CreditCard, label: 'Take a Loan', href: '/seller/loans', tone: 'bg-amber-600' },
    { icon: BarChart3, label: 'Analytics', href: '/seller/analytics', tone: 'bg-emerald-600' },
    { icon: MessageSquare, label: 'Messages', href: '/seller/messages', tone: 'bg-indigo-600' },
  ];

  const pendingOrders = Math.max(stats?.totalProducts ? stats.totalProducts - stats.publishedProducts : 0, 0);
  const todayProfit = stats?.totalProfit ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const availableBalance = stats?.availableBalance ?? 0;
  const storeVisitors = stats?.storeVisitors ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const publishedProducts = stats?.publishedProducts ?? 0;
  const firstName = user?.name?.split(' ')[0] || 'User';
  const brandIsHub = platformName.endsWith('Hub');
  const brandHead = brandIsHub ? platformName.slice(0, -3) : platformName;

  const trendLabels = [
    'Feb 14', 'Feb 16', 'Feb 18', 'Feb 20', 'Feb 22', 'Feb 24', 'Feb 26', 'Feb 28',
    'Mar 2', 'Mar 4', 'Mar 6', 'Mar 8', 'Mar 10', 'Mar 12', 'Mar 14',
  ];

  const revenueSeed = [200, 210, 180, 220, 190, 240, 220, 260, 250, 280, 6400, 900, 22000, 3200, 108000];
  const seedMax = Math.max(...revenueSeed);
  const revenueTarget = totalRevenue > 0 ? totalRevenue : 108000;
  const revenueScale = revenueTarget / seedMax;
  const revenueSeries = revenueSeed.map((v) => Math.round(v * revenueScale));
  const profitSeries = revenueSeries.map((v) => Math.round(v * 0.2));

  const visibleCount = activeRange === '7D' ? 7 : trendLabels.length;
  const visibleLabels = trendLabels.slice(-visibleCount);
  const visibleRevenue = revenueSeries.slice(-visibleCount);
  const visibleProfit = profitSeries.slice(-visibleCount);

  const chartMax = Math.max(120000, ...visibleRevenue, ...visibleProfit);
  const chartWidth = 960;
  const chartHeight = 220;
  const toPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const x = values.length === 1 ? 0 : (index / (values.length - 1)) * chartWidth;
        const y = chartHeight - (value / chartMax) * (chartHeight - 10) - 4;
        return `${x},${y}`;
      })
      .join(' ');

  const revenueLinePoints = toPoints(visibleRevenue);
  const profitLinePoints = toPoints(visibleProfit);
  const revenueAreaPoints = `${revenueLinePoints} ${chartWidth},${chartHeight} 0,${chartHeight}`;

  const topProducts = [
    { name: 'Scooter Motorcycle', amount: totalRevenue > 0 ? totalRevenue * 0.88 : 210976.29 },
    { name: 'Chanel Coco Noir Eau...', amount: totalRevenue > 0 ? totalRevenue * 0.055 : 13215.72 },
    { name: "Dior J'adore", amount: totalRevenue > 0 ? totalRevenue * 0.038 : 9213.24 },
    { name: 'Powder Canister', amount: totalRevenue > 0 ? totalRevenue * 0.012 : 2994.65 },
    { name: 'Calvin Klein CK One', amount: totalRevenue > 0 ? totalRevenue * 0.007 : 1756.62 },
  ];

  const recentOrders = [
    { title: 'Scooter Motorcycle', code: '#314-ZW3C', amount: 107217.46, profit: 20048.85 },
    { title: 'Scooter Motorcycle', code: '#313-9XKG', amount: 103758.83, profit: 19402.11 },
    { title: "Dior J'adore", code: '#310-OPW0', amount: 9213.24, profit: 1692.38 },
    { title: 'Chanel Coco Noir Eau De', code: '#310-A6UW', amount: 13215.72, profit: 2471.39 },
    { title: 'Scooter Motorcycle', code: '#309-KT2A', amount: 1834.58, profit: 343.05 },
  ];

  const widthClassFromRatio = (ratio: number) => {
    if (ratio >= 0.95) return 'w-[96%]';
    if (ratio >= 0.8) return 'w-[82%]';
    if (ratio >= 0.6) return 'w-[64%]';
    if (ratio >= 0.4) return 'w-[46%]';
    if (ratio >= 0.25) return 'w-[30%]';
    if (ratio >= 0.12) return 'w-[16%]';
    return 'w-[4%]';
  };

  return (
    <div className="flex min-h-screen bg-[#edf1f7] text-slate-900">
      {/* Sidebar */}
      <aside className="hidden w-[224px] flex-col bg-[#1f456d] text-white shadow-lg lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#1f456d]">
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-[24px] font-bold leading-none tracking-tight">
              <span className="text-white">{brandHead}</span>
              {brandIsHub ? <span className="text-amber-400">Hub</span> : null}
            </h1>
          </div>
        </div>

        <nav className="mt-4 space-y-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  item.active
                    ? 'bg-white text-[#173b62]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile at Bottom */}
        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
            )}
            <div className="flex-1">
              <p className="truncate text-sm font-semibold leading-none tracking-tight text-white">{user?.name || 'Seller'}</p>
              <div className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Seller
              </div>
            </div>
          </div>
          <Link
            href="/auth/logout"
            className="mt-3 inline-flex items-center gap-2 text-xs text-white/75 transition-colors hover:text-white"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-5">
            <button className="text-slate-500 transition-colors hover:text-slate-700" type="button" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f456d] text-sm font-semibold text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <p className="text-sm font-semibold text-slate-700">{firstName}</p>
                <ChevronDown size={14} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5 lg:px-6">
          {/* Account Under Review Banner */}
          {storeStatus && storeStatus !== 'APPROVED' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <div className="text-amber-600 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 text-sm">Account Under Review</h3>
                <p className="text-amber-800 text-xs">
                  Your seller account is being reviewed by our team. This typically takes 2-3 business days. You&apos;ll receive
                  an email once approved. Meanwhile, you can explore your dashboard and set up your store profile.
                </p>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#173b62] sm:text-3xl">Welcome back, {firstName}!</h1>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="text-lg font-medium leading-none text-slate-600 sm:text-xl">{storeName || 'Your Store'}</h2>
                {storeStatus && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusTone(storeStatus)}`}>
                    {getStatusLabel(storeStatus)}
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/seller/products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#173b62] px-4 py-2 text-xs font-semibold leading-none text-white transition-colors hover:bg-[#12304f]"
            >
              <Plus size={16} />
              <span>Manage Products</span>
            </Link>
          </div>

          <section className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group min-h-[74px] rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-center shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className={`mb-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-white ${action.tone}`}>
                    <ActionIcon size={14} />
                  </div>
                  <p className="text-xs font-semibold leading-none text-slate-700">{action.label}</p>
                </Link>
              );
            })}
          </section>

          {/* Dashboard Stats */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
          ) : stats ? (
            <>
              <section className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-h-[138px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-100 text-blue-700 shadow-sm">
                    <ShoppingCart size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{totalOrders}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-none text-slate-600">Total Orders</p>
                  <p className="text-xs text-slate-400">All time</p>
                </div>

                <div className="min-h-[138px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-100 text-emerald-700 shadow-sm">
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{fullMoney(totalRevenue)}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-none text-slate-600">Total Revenue</p>
                  <p className="text-xs text-slate-400">From completed orders</p>
                </div>

                <div className="min-h-[138px] rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-100 bg-emerald-100 text-emerald-700 shadow-sm">
                      <Wallet size={16} />
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{fullMoney(todayProfit)}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-none text-slate-600">Today&apos;s Profit</p>
                  <p className="text-xs text-slate-400">1 order today</p>
                </div>

                <div className="min-h-[138px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-violet-100 bg-violet-100 text-violet-700 shadow-sm">
                    <Package size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{publishedProducts} published</p>
                  <p className="mt-1.5 text-sm font-semibold leading-none text-slate-600">Products</p>
                  <p className="text-xs text-slate-400">In your store</p>
                </div>
              </section>

              <section className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-100 text-blue-700 shadow-sm">
                    <Eye size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{storeVisitors.toLocaleString()}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600">Store Views</p>
                  <p className="text-xs text-slate-400">This month</p>
                </div>

                <div className="rounded-xl border-2 border-cyan-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-100 bg-cyan-100 text-cyan-700 shadow-sm">
                    <Receipt size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{fullMoney(availableBalance)}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600">Available Balance</p>
                  <p className="text-xs text-slate-400">Ready to withdraw</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-sm">
                    <Clock3 size={16} />
                  </div>
                  <p className="text-3xl font-bold leading-none text-[#173b62]">{pendingOrders}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-600">Pending Orders</p>
                  <p className="text-xs text-slate-400">Awaiting delivery</p>
                </div>
              </section>

              <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#173b62]">Revenue &amp; Profit Overview</h3>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs sm:text-sm">
                    {(['7D', '30D', '90D', 'ALL'] as RangeKey[]).map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setActiveRange(range)}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                          activeRange === range
                            ? 'bg-[#173b62] text-white'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {range === 'ALL' ? 'All' : range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="relative min-w-[720px]">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[180px] w-full rounded-xl border border-slate-100 bg-white sm:h-[210px]">
                      <defs>
                        <pattern id="grid" width="66" height="44" patternUnits="userSpaceOnUse">
                          <path d="M 66 0 L 0 0 0 44" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 4" />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#grid)" />
                      <polygon points={revenueAreaPoints} fill="#173b62" fillOpacity="0.08" />
                      <polyline points={revenueLinePoints} fill="none" stroke="#173b62" strokeWidth="3" strokeLinecap="round" />
                      <polyline points={profitLinePoints} fill="none" stroke="#d19928" strokeWidth="3" strokeLinecap="round" />
                    </svg>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-center text-xs text-slate-500">
                      {visibleLabels.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-5 text-base font-medium sm:text-lg">
                      <div className="flex items-center gap-1 text-[#d19928]"><span>-</span><span>Profit</span></div>
                      <div className="flex items-center gap-1 text-[#173b62]"><span>-</span><span>Revenue</span></div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-4 grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                  <h3 className="mb-3 text-lg font-bold text-[#173b62]">Top Performing Products</h3>
                  <div className="space-y-4">
                    {topProducts.map((product) => {
                      const max = topProducts[0]?.amount || 1;
                      const ratio = Math.max(product.amount / max, 0.01);
                      const widthClass = widthClassFromRatio(ratio);
                      return (
                        <div key={product.name} className="grid grid-cols-[100px_1fr] items-center gap-2 sm:grid-cols-[130px_1fr]">
                          <p className="truncate text-xs text-slate-500 sm:text-sm">{product.name}</p>
                          <div className="h-3 rounded-md bg-slate-100">
                            <div className={`h-3 rounded-md bg-[#173b62] ${widthClass}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                  <h3 className="mb-3 text-lg font-bold text-[#173b62]">Orders by Status</h3>
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative mb-4 flex h-36 w-36 items-center justify-center rounded-full border-[22px] border-emerald-600 sm:h-44 sm:w-44 sm:border-[30px]">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-[#173b62] sm:text-3xl">{totalOrders}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                      <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                  <h3 className="mb-3 text-lg font-bold text-[#173b62]">Sales by Category</h3>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => {
                      const max = topProducts[0]?.amount || 1;
                      const ratio = Math.max(product.amount / max, 0.01);
                      const widthClass = widthClassFromRatio(ratio);
                      const orders = Math.max(Math.round((totalOrders || 120) / (index + 1)), 12);
                      return (
                        <div key={`category-${product.name}`}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-[#173b62]">{product.name.split(' ')[0]}</p>
                            <p className="text-xs text-slate-500">{fullMoney(product.amount)} · {orders} orders</p>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-200">
                            <div className={`h-2.5 rounded-full bg-[#2f5fad] ${widthClass}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#173b62]">Recent Orders</h3>
                    <Link href="/seller/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173b62] hover:text-[#12304f]">
                      <span>View All</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="max-h-[250px] space-y-3 overflow-y-auto pr-1">
                    {recentOrders.map((order) => (
                      <div key={order.code} className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-[#173b62]">{order.title}</p>
                          <p className="text-xs text-slate-500">{order.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[#173b62]">{fullMoney(order.amount)}</p>
                          <p className="text-sm font-semibold text-emerald-600">+{fullMoney(order.profit)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

