"use client"

import { useEffect, useState } from 'react'

type SubStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | null

export default function SellerPendingBanner(){
  const [status, setStatus] = useState<SubStatus>(null)

  useEffect(()=>{
    let cancelled = false
    async function load(){
      try{
        const rawUser = localStorage.getItem('nextsells_user')
        const user = rawUser ? JSON.parse(rawUser) : null
        const sellerId = user?.id || localStorage.getItem('ai_subscription_sellerId')
        if(!sellerId){
          const localStatus = localStorage.getItem('ai_subscription_status') as SubStatus
          if(!cancelled) setStatus(localStatus || null)
          return
        }

        const res = await fetch(`/api/seller/ai-subscriptions?sellerId=${encodeURIComponent(sellerId)}`)
        const data = await res.json()
        if(!data?.success || !Array.isArray(data.data)){
          const localStatus = localStorage.getItem('ai_subscription_status') as SubStatus
          if(!cancelled) setStatus(localStatus || null)
          return
        }

        const latest = data.data
          .slice()
          .sort((a: any, b: any)=>{
            const aTime = new Date(a.requestedAt || a.createdAt || 0).getTime()
            const bTime = new Date(b.requestedAt || b.createdAt || 0).getTime()
            return bTime - aTime
          })[0]

        const nextStatus = (latest?.status || null) as SubStatus
        try{
          if(nextStatus){
            localStorage.setItem('ai_subscription_status', nextStatus)
          } else {
            localStorage.removeItem('ai_subscription_status')
          }
        }catch(e){}

        if(!cancelled) setStatus(nextStatus)
      }catch(e){
        if(!cancelled) setStatus(null)
      }
    }

    void load()
    return ()=>{ cancelled = true }
  }, [])

  if(!status) return null

  if(status === 'PENDING'){
    return (
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl text-yellow-600">⏳</div>
          <div>
            <div className="text-lg font-semibold text-yellow-800">Approval Pending</div>
            <div className="text-sm text-yellow-700 mt-1">Your AI Analysis subscription is awaiting admin approval. You'll get access once your payment is confirmed.</div>
          </div>
        </div>
      </div>
    )
  }

  if(status === 'ACTIVE'){
    return (
      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl text-emerald-600">✅</div>
          <div>
            <div className="text-lg font-semibold text-emerald-800">Subscription Active</div>
            <div className="text-sm text-emerald-700 mt-1">Your AI Analysis subscription is active. You now have full access.</div>
          </div>
        </div>
      </div>
    )
  }

  if(status === 'REJECTED'){
    return (
      <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl text-rose-600">⚠️</div>
          <div>
            <div className="text-lg font-semibold text-rose-800">Payment Rejected</div>
            <div className="text-sm text-rose-700 mt-1">Your request was rejected. Please contact support or submit again.</div>
          </div>
        </div>
      </div>
    )
  }

  if(status === 'EXPIRED'){
    return (
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center gap-4">
          <div className="text-2xl text-slate-600">⏲️</div>
          <div>
            <div className="text-lg font-semibold text-slate-800">Subscription Expired</div>
            <div className="text-sm text-slate-700 mt-1">Your AI Analysis subscription has expired. Renew to regain access.</div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
