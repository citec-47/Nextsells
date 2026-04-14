'use client';

import { useEffect, useRef, useState } from 'react';

type ActiveTab = 'withdrawals' | 'earnings';
type WithdrawalMethod = 'bank' | 'bitcoin';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('withdrawals');
  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>('bank');
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const requestFormRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/seller/payments', {
        credentials: 'include',
        headers,
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

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      load();
    }, 7000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showRequestForm && requestFormRef.current) {
      requestFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showRequestForm]);

  const openRequestForm = () => {
    setShowRequestForm(true);
    setError('');
    setSuccessMessage('');

    if (requestFormRef.current) {
      requestFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRequestPayment = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (data && parsedAmount > data.stats.availableBalance) {
      setError('Amount exceeds available balance.');
      return;
    }

    if (withdrawalMethod === 'bank') {
      if (!bankName.trim() || !accountNumber.trim() || !accountHolderName.trim()) {
        setError('Please provide bank name, account number, and account holder name.');
        return;
      }
    }

    if (withdrawalMethod === 'bitcoin' && !walletAddress.trim()) {
      setError('Please provide a BTC wallet address.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const normalizedBankAccount = withdrawalMethod === 'bank'
        ? `${bankName.trim()} | ${accountHolderName.trim()} | ${accountNumber.trim()}`
        : `BTC Wallet | ${walletAddress.trim()}`;

      const normalizedNotes = [
        notes.trim(),
        `method=${withdrawalMethod}`,
      ].filter(Boolean).join(' | ');

      const response = await fetch('/api/seller/payments', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          amount: parsedAmount,
          bankAccount: normalizedBankAccount,
          notes: normalizedNotes,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit payment request');
      }

      setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountHolderName('');
        setWalletAddress('');
        setNotes('');
        setWithdrawalMethod('bank');
      setSuccessMessage('Payment request submitted. Admin review is pending.');
      setShowRequestForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const money = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const statCardClasses =
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]';

  const iconWrapClasses =
    'inline-flex h-8 w-8 items-center justify-center rounded-xl';

  return (
    <div className="min-h-screen bg-[#f4f5f7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Payments</h1>
            <p className="mt-1 text-xl text-slate-500">Manage your earnings and withdrawals</p>
          </div>

          <button
            type="button"
            onClick={openRequestForm}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ea3a32] px-6 text-base font-semibold text-white transition hover:bg-[#d5312a]"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-xs">+</span>
            Request Withdrawal
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading payments...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : data ? (
          <>
            {showRequestForm ? (
              <div ref={requestFormRef} className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.08)] md:p-7">
                <h2 className="text-xl font-semibold text-slate-900">Request Withdrawal</h2>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Withdrawal Method</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('bank')}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        withdrawalMethod === 'bank'
                          ? 'border-[#ea3a32] bg-[#ea3a32] text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-base">🏦</span>
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawalMethod('bitcoin')}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        withdrawalMethod === 'bitcoin'
                          ? 'border-[#ea3a32] bg-[#ea3a32] text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-base">₿</span>
                      Bitcoin (BTC)
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Amount (USD)</label>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                    />
                    <p className="mt-2 text-xs text-slate-400">Max: {money(data.stats.availableBalance)}</p>
                  </div>

                  {withdrawalMethod === 'bank' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
                      <input
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        placeholder="e.g. First National Bank"
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">BTC Wallet Address</label>
                      <input
                        value={walletAddress}
                        onChange={(event) => setWalletAddress(event.target.value)}
                        placeholder="bc1..."
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                  )}
                </div>

                {withdrawalMethod === 'bank' ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Number</label>
                      <input
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="Account number"
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Account Holder Name</label>
                      <input
                        value={accountHolderName}
                        onChange={(event) => setAccountHolderName(event.target.value)}
                        placeholder="Full name on account"
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Note (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Any additional notes for customer support..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-[#ea3a32] placeholder:text-slate-400 focus:ring-2"
                  />
                </div>

                <div className="mt-5 flex items-center gap-6">
                  <button
                    type="button"
                    onClick={handleRequestPayment}
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#ea3a32] px-5 text-sm font-semibold text-white transition hover:bg-[#d5312a] disabled:opacity-60"
                  >
                    <span>↗</span>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {successMessage ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className={statCardClasses}>
                <div className="mb-6 flex items-start justify-between gap-2">
                  <p className="text-2xl font-medium text-slate-500">Total Earnings</p>
                  <span className={`${iconWrapClasses} bg-emerald-50 text-emerald-600`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14l5-5 4 4 7-7" /><path d="M14 6h6v6" /></svg>
                  </span>
                </div>
                <p className="text-5xl font-bold tracking-tight text-slate-900">{money(data.stats.totalRevenue)}</p>
                <p className="mt-8 text-xl text-slate-500">From approved orders</p>
              </div>

              <div className={statCardClasses}>
                <div className="mb-6 flex items-start justify-between gap-2">
                  <p className="text-2xl font-medium text-slate-500">Available Balance</p>
                  <span className={`${iconWrapClasses} bg-blue-50 text-blue-600`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M15 12h4" /></svg>
                  </span>
                </div>
                <p className="text-5xl font-bold tracking-tight text-slate-900">{money(data.stats.availableBalance)}</p>
                <p className="mt-8 text-xl text-slate-500">Ready to withdraw</p>
              </div>

              <div className={statCardClasses}>
                <div className="mb-6 flex items-start justify-between gap-2">
                  <p className="text-2xl font-medium text-slate-500">Pending</p>
                  <span className={`${iconWrapClasses} bg-amber-50 text-amber-600`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l3 2" /></svg>
                  </span>
                </div>
                <p className="text-5xl font-bold tracking-tight text-slate-900">{money(data.stats.pendingPayout)}</p>
                <p className="mt-8 text-xl text-slate-500">Awaiting approval</p>
              </div>

              <div className={statCardClasses}>
                <div className="mb-6 flex items-start justify-between gap-2">
                  <p className="text-2xl font-medium text-slate-500">Total Withdrawn</p>
                  <span className={`${iconWrapClasses} bg-fuchsia-50 text-fuchsia-600`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20" /><path d="M17 7.5c0-1.9-2.2-3.5-5-3.5S7 5.6 7 7.5 9.2 11 12 11s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" /></svg>
                  </span>
                </div>
                <p className="text-5xl font-bold tracking-tight text-slate-900">{money(data.stats.paidOut)}</p>
                <p className="mt-8 text-xl text-slate-500">Successfully withdrawn</p>
              </div>
            </div>

            <div className="mb-5 flex w-fit rounded-2xl bg-slate-200 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('withdrawals')}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Withdrawal History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('earnings')}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
                  activeTab === 'earnings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Earnings History
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="min-h-[340px] p-6">
                {activeTab === 'withdrawals' ? (
                  data.withdrawals.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                      <div className="mb-4 text-6xl text-slate-200">$</div>
                      <h3 className="text-3xl font-semibold text-slate-600">No withdrawals yet</h3>
                      <p className="mt-2 text-lg text-slate-400">Your withdrawal history will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.withdrawals.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-2 py-4 text-sm">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{money(row.amount)}</p>
                            <p className="text-xs text-slate-500">{row.bankAccount || 'No bank account set'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{new Date(row.requestedAt).toLocaleDateString()}</p>
                            <p className="text-xs font-semibold uppercase text-slate-700">{row.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="min-h-[300px]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Earnings</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{money(data.stats.totalRevenue)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available Balance</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{money(data.stats.availableBalance)}</p>
                      </div>
                    </div>

                    <p className="mt-6 text-sm text-slate-500">
                      Detailed earnings transactions are not yet available. This tab currently shows a quick snapshot.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
