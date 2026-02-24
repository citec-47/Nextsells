'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Pending Orders</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/seller/products"
            className="p-4 bg-blue-50 border-2 border-blue-200 rounded hover:border-blue-400 transition"
          >
            <h3 className="font-semibold text-blue-900">Manage Products</h3>
            <p className="text-sm text-blue-700">View and edit your product listings</p>
          </Link>

          <Link
            href="/seller/onboarding"
            className="p-4 bg-green-50 border-2 border-green-200 rounded hover:border-green-400 transition"
          >
            <h3 className="font-semibold text-green-900">Complete Onboarding</h3>
            <p className="text-sm text-green-700">Finish your seller setup</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
