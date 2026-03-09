'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Store,
  Plus,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useAuth0User } from '@/lib/auth/auth0Client';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  publishedProducts: number;
  availableBalance: number;
  storeVisitors: number;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth0User();
  const [storeName] = useState('Nexora Marke');
  const [storeStatus] = useState('Pending Approval');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/seller/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
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
    { icon: Plus, label: 'Add Products', href: '/seller/products/new' },
    { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
    { icon: CreditCard, label: 'Payments', href: '/seller/payments' },
    { icon: MessageSquare, label: 'Messages', href: '/seller/messages' },
    { icon: Settings, label: 'Store Settings', href: '/seller/settings' },
    { icon: BarChart3, label: 'Analytics', href: '/seller/analytics' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold">MarketHub</h1>
        </div>

        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                  item.active
                    ? 'bg-blue-800 border-l-4 border-blue-400'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile at Bottom */}
        <div className="absolute bottom-0 w-64 border-t border-blue-800 bg-blue-900 p-4">
          <div className="flex items-center space-x-3">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-700" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.name || 'User'}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
          </div>
          <a
            href="/api/auth/logout"
            className="flex items-center space-x-2 mt-4 text-blue-100 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-8">
          {/* Account Under Review Banner */}
          {storeStatus === 'Pending Approval' && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded flex items-start space-x-3">
              <div className="text-yellow-600 text-2xl mt-1">⏱️</div>
              <div>
                <h3 className="font-semibold text-yellow-900">Account Under Review</h3>
                <p className="text-yellow-800 text-sm">
                  Your seller account is being reviewed by our team. This typically takes 2-3 business days. You'll receive
                  an email once approved. Meanwhile, you can explore your dashboard and set up your store profile.
                </p>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <div className="flex items-center space-x-3 mt-4">
              <h2 className="text-xl font-semibold text-gray-700">{storeName}</h2>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {storeStatus}
              </span>
            </div>
          </div>

          {/* Manage Products Button */}
          <div className="mb-8">
            <Link
              href="/seller/products"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus size={20} />
              <span>Manage Products</span>
            </Link>
          </div>

          {/* Dashboard Stats */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Orders */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                    <p className="text-gray-500 text-xs mt-2">All time</p>
                  </div>
                  <div className="text-blue-500 text-2xl">📦</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Revenue</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs mt-2">Total from completed orders</p>
                  </div>
                  <div className="text-green-500 text-2xl">💵</div>
                </div>
              </div>

              {/* Profit */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Profit</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">${stats.totalProfit.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs mt-2">Your margin earnings</p>
                  </div>
                  <div className="text-green-500 text-2xl">📈</div>
                </div>
              </div>

              {/* Published */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Published</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.publishedProducts}</p>
                  </div>
                  <div className="text-purple-500 text-2xl">✅</div>
                </div>
              </div>

              {/* Available Balance */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Available Balance</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">${stats.availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="text-yellow-500 text-2xl">💳</div>
                </div>
              </div>

              {/* Store Visitors */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Store Visitors</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.storeVisitors}</p>
                  </div>
                  <div className="text-blue-500 text-2xl">👁️</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

