'use client';

import { useEffect, useState } from 'react';

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  bankAccount: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
};

type PaymentData = {
  stats: {
    totalRevenue: number;
    paidOut: number;
    pendingPayout: number;
    availableBalance: number;
  };
  withdrawals: Withdrawal[];
};

export default function SellerPaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/seller/payments', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Failed to load payments');
        }
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold text-slate-900">Payments</h1>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading payments...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : data ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Total Revenue</p><p className="text-lg font-bold text-[#173b62]">{money(data.stats.totalRevenue)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Paid Out</p><p className="text-lg font-bold text-emerald-700">{money(data.stats.paidOut)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Pending Payout</p><p className="text-lg font-bold text-amber-700">{money(data.stats.pendingPayout)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Available Balance</p><p className="text-lg font-bold text-blue-700">{money(data.stats.availableBalance)}</p></div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Withdrawal History</div>
              <div className="divide-y divide-slate-100">
                {data.withdrawals.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No withdrawals yet.</p>
                ) : (
                  data.withdrawals.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{money(row.amount)}</p>
                        <p className="text-xs text-slate-500">{row.bankAccount || 'No bank account set'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{new Date(row.requestedAt).toLocaleDateString()}</p>
                        <p className="text-xs font-semibold uppercase text-slate-700">{row.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
