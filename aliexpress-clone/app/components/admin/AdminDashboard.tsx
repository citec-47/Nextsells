'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  pendingApprovals: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
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
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Sellers</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalSellers}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Pending Approvals</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalProducts}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Management Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/seller-approvals"
            className="p-4 bg-orange-50 border-2 border-orange-200 rounded hover:border-orange-400 transition"
          >
            <h3 className="font-semibold text-orange-900">Seller Approvals</h3>
            <p className="text-sm text-orange-700">Review pending seller applications</p>
          </Link>

          <Link
            href="/admin/sellers"
            className="p-4 bg-blue-50 border-2 border-blue-200 rounded hover:border-blue-400 transition"
          >
            <h3 className="font-semibold text-blue-900">Manage Sellers</h3>
            <p className="text-sm text-blue-700">View all sellers and their status</p>
          </Link>

          <Link
            href="/admin/users"
            className="p-4 bg-green-50 border-2 border-green-200 rounded hover:border-green-400 transition"
          >
            <h3 className="font-semibold text-green-900">Manage Users</h3>
            <p className="text-sm text-green-700">View and manage all users</p>
          </Link>

          <Link
            href="/admin/products"
            className="p-4 bg-purple-50 border-2 border-purple-200 rounded hover:border-purple-400 transition"
          >
            <h3 className="font-semibold text-purple-900">Manage Products</h3>
            <p className="text-sm text-purple-700">Review and manage product listings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
