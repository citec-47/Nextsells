"use client"

import {useEffect, useState} from 'react'

function readSellerFromStorage() {
  if (typeof window === 'undefined') return { id: null, name: 'Seller' };
  try {
    const raw = localStorage.getItem('nextsells_user');
    if (!raw) return { id: null, name: 'Seller' };
    const user = JSON.parse(raw) as any;
    return { id: user?.id ?? null, name: user?.name ?? 'Seller' };
  } catch {
    return { id: null, name: 'Seller' };
  }
}

export default function SellerAIStatusCard() {
  const seller = readSellerFromStorage();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [status, setStatus] = useState('INACTIVE');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!seller.id) return;
    void load();
  }, [seller.id]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/ai-subscriptions?sellerId=${encodeURIComponent(seller.id)}`);
      const json = await res.json();
      if (json.success) {
        setSubscriptions(json.data || []);
        const latest = (json.data || [])[0];
        if (latest) {
          setStatus(latest.status);
          setDaysRemaining(latest.daysRemaining ?? null);
        } else {
          setStatus('INACTIVE');
          setDaysRemaining(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold">AI Analysis</h3>
      <p className="text-sm text-gray-500 mt-1">Status: <span className="font-medium">{status}</span>{daysRemaining !== null ? ` — ${daysRemaining} days left` : ''}</p>

      <div className="mt-4">
        {status === 'ACTIVE' ? (
          <button className="bg-[#06122a] text-white px-4 py-2 rounded-lg">Access AI Tools</button>
        ) : status === 'PENDING' ? (
          <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg">Pending Review</button>
        ) : (
          <button className="bg-[#ea3a32] text-white px-4 py-2 rounded-lg">Subscribe ($500)</button>
        )}
      </div>
    </div>
  )
}
