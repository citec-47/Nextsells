'use client';

import { useEffect, useState } from 'react';

type SellerOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    subtotal: number;
  }>;
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/seller/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to load orders');
        }
        setOrders(json.data.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Orders</h1>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading orders...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No orders found yet.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.orderId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{order.buyerName} • {order.buyerEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{order.status}</span>
                    <p className="mt-1 text-sm font-bold text-[#173b62]">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <p key={item.productId} className="text-xs text-slate-600">
                      {item.title} x{item.quantity}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
