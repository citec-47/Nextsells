"use client"

import { useEffect, useState } from 'react'

type Sub = any

export default function AdminAIControls(){
  const [stats, setStats] = useState({ pending:0, active:0, revenue:0 })
  const [pending, setPending] = useState<Sub[]>([])
  const [active, setActive] = useState<Sub[]>([])
  const [expired, setExpired] = useState<Sub[]>([])
  const [tab, setTab] = useState<'pending'|'active'|'expired'>('pending')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ void load() }, [])

  async function load(){
    setLoading(true)
    try{
      const s = await fetch('/api/admin/ai-subscriptions/summary').then(r=>r.json())
      if(s?.success) setStats(s.stats)
      const p = await fetch('/api/admin/ai-subscriptions/pending').then(r=>r.json())
      if(p?.success) setPending(p.data || [])
      const a = await fetch('/api/admin/ai-subscriptions/active').then(r=>r.json())
      if(a?.success) setActive(a.data || [])
      const e = await fetch('/api/admin/ai-subscriptions/expired').then(r=>r.json())
      if(e?.success) setExpired(e.data || [])
    }catch(err){ console.error(err) }
    setLoading(false)
  }

  async function approve(id:string){
    const adminRaw = localStorage.getItem('nextsells_user')
    const admin = adminRaw ? JSON.parse(adminRaw) : { id: 'admin' }
    const res = await fetch(`/api/admin/ai-subscriptions/${id}/approve`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, adminId: admin.id || admin.name || 'admin' }) })
    const j = await res.json()
    if(j.success){ alert('Approved'); await load() } else alert('Error')
  }

  async function rejectId(id:string){
    const reason = prompt('Reason for rejection (optional)') || ''
    const adminRaw = localStorage.getItem('nextsells_user')
    const admin = adminRaw ? JSON.parse(adminRaw) : { id: 'admin' }
    const res = await fetch(`/api/admin/ai-subscriptions/${id}/reject`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, adminId: admin.id || admin.name || 'admin', reason }) })
    const j = await res.json()
    if(j.success){ alert('Rejected'); await load() } else alert('Error')
  }

  async function revoke(id:string){
    const reason = prompt('Reason for revoking access (optional)') || ''
    const adminRaw = localStorage.getItem('nextsells_user')
    const admin = adminRaw ? JSON.parse(adminRaw) : { id: 'admin' }
    const res = await fetch(`/api/admin/ai-subscriptions/${id}/revoke`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, adminId: admin.id || admin.name || 'admin', reason }) })
    const j = await res.json()
    if(j.success){ alert('Access revoked'); await load() } else alert('Error')
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Pending Review</p>
          <div className="mt-4 text-3xl font-bold">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <div className="mt-4 text-3xl font-bold">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Revenue</p>
            <div className="mt-2 text-3xl font-bold">${stats.revenue}</div>
          </div>
          <div className="text-gray-400">$</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="inline-flex rounded-full bg-white shadow-sm">
          <button onClick={()=>setTab('pending')} className={`px-4 py-2 text-sm ${tab==='pending' ? 'bg-slate-900 text-white' : 'text-gray-700'} rounded-l-full`}>Pending ({stats.pending})</button>
          <button onClick={()=>setTab('active')} className={`px-4 py-2 text-sm ${tab==='active' ? 'bg-slate-900 text-white' : 'text-gray-700'}`}>Active ({stats.active})</button>
          <button onClick={()=>setTab('expired')} className={`px-4 py-2 text-sm ${tab==='expired' ? 'bg-slate-900 text-white' : 'text-gray-700'} rounded-r-full`}>Expired ({expired.length})</button>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        {loading ? <div>Loading...</div> : (
          tab === 'pending' ? (
            pending.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No pending subscriptions</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="py-2">Seller</th>
                    <th className="py-2">Requested</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(p=> (
                    <tr key={p.id} className="border-t">
                      <td className="py-3">{p.sellerId}</td>
                      <td className="py-3">{new Date(p.requestedAt).toLocaleString()}</td>
                      <td className="py-3">${p.paymentAmount}</td>
                      <td className="py-3">
                        <button onClick={()=>approve(p.id)} className="mr-2 px-2 py-1 bg-green-500 text-white rounded">Approve</button>
                        <button onClick={()=>rejectId(p.id)} className="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : tab === 'active' ? (
            active.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No active subscriptions</div>
            ) : (
              <div className="space-y-4">
                {active.map(p=> (
                  <div key={p.id} className="rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.sellerId}</div>
                      <div className="text-xs text-gray-500">${p.paymentAmount} · Requested: {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString() : '—'} · Approved: {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : '—'} · Expires: {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : '—'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">ACTIVE</span>
                      <button onClick={()=>revoke(p.id)} className="px-3 py-1 text-sm rounded-full bg-rose-100 text-rose-700">Revoke Access</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            expired.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No expired subscriptions</div>
            ) : (
              <div className="space-y-3">
                {expired.map(p=> (
                  <div key={p.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="font-semibold">{p.sellerId}</div>
                    <div className="text-xs text-gray-500">Expired: {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : '—'}</div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </section>
    </div>
  )
}
