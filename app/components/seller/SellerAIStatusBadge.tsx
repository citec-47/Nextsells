"use client"

import { useEffect, useState } from 'react'

type SubStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | null

type Subscription = {
  status?: string
  requestedAt?: string
  createdAt?: string
}

export default function SellerAIStatusBadge(){
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

        const latest = (data.data as Subscription[])
          .slice()
          .sort((a, b)=>{
            const aTime = new Date(a.requestedAt || a.createdAt || 0).getTime()
            const bTime = new Date(b.requestedAt || b.createdAt || 0).getTime()
            return bTime - aTime
          })[0]

        const nextStatus = (latest?.status || null) as SubStatus
        if(!cancelled) setStatus(nextStatus)
      }catch(e){
        const localStatus = localStorage.getItem('ai_subscription_status') as SubStatus
        if(!cancelled) setStatus(localStatus || null)
      }
    }

    void load()
    return ()=>{ cancelled = true }
  }, [])

  if(status !== 'ACTIVE') return null

  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      ACTIVE
    </span>
  )
}
