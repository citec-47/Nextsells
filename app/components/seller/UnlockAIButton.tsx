"use client"

import { useState } from 'react'

export default function UnlockAIButton(){
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<'bank'|'crypto'|null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle'|'pending'|'done'>('idle')

  async function confirm(){
    const raw = localStorage.getItem('nextsells_user')
    const user = raw ? JSON.parse(raw) : { id: null }
    if(!user?.id){ alert('Seller not logged in'); return }
    setLoading(true)
    try{
      const res = await fetch('/api/seller/ai-subscriptions/request', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ sellerId: user.id, paymentAmount: 299, paymentMethod: method || 'bank' })
      })
      const j = await res.json()
      if(j.success){
        setStatus('pending')
        // persist pending state so seller sees approval pending after reload
        try{ localStorage.setItem('ai_subscription_status', 'PENDING'); localStorage.setItem('ai_subscription_sellerId', user.id); }catch(e){}
        setOpen(false)
        alert('Payment method selected — awaiting admin approval')
      } else {
        alert('Error submitting request')
      }
    }catch(err){ console.error(err); alert('Request failed') }
    setLoading(false)
  }

  if(status === 'pending'){
    return (
      <div>
        <button className="bg-[#ea3a32] text-white px-4 py-2 rounded-lg">Subscription Pending</button>
      </div>
    )
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} className="bg-[#06122a] text-white px-6 py-3 rounded-full shadow-lg">Unlock AI Analysis</button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={()=>setOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">AI Market Analysis</h3>
                <div className="text-sm text-muted-foreground">$299 one-time payment</div>
              </div>
              <button onClick={()=>setOpen(false)} className="text-gray-500">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-2">Select Payment Method</p>
              <div className="flex gap-3">
                <button onClick={()=>setMethod('bank')} className={`flex-1 p-4 border rounded ${method==='bank'?'border-sky-600':'border-gray-200'}`}>Bank Transfer</button>
                <button onClick={()=>setMethod('crypto')} className={`flex-1 p-4 border rounded ${method==='crypto'?'border-sky-600':'border-gray-200'}`}>Bitcoin</button>
              </div>
            </div>

            <div className="mt-6">
              <button disabled={!method || loading} onClick={confirm} className="w-full bg-[#06122a] text-white px-4 py-3 rounded-md">Confirm Payment</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
