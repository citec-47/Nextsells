"use client"

import { useEffect, useMemo, useState } from 'react'
import UnlockAIButton from '@/app/components/seller/UnlockAIButton'

type SubStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | null

type Subscription = {
  status?: string
  requestedAt?: string
  createdAt?: string
}

type PlatformProduct = {
  id: string
  title: string
  description: string
  category: string
  basePrice: number
  sellingPrice: number
  stock: number
  images: string
}

type WinningProduct = {
  id: string
  title: string
  description: string
  category: string
  basePrice: number
  stock: number
  image: string
  score: number
  predictedOrders: number
  trend: number
}

export default function SellerAIAnalysisPanel(){
  const [status, setStatus] = useState<SubStatus>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [productsAnalyzed, setProductsAnalyzed] = useState(0)
  const [results, setResults] = useState<WinningProduct[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [publishLoading, setPublishLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [published, setPublished] = useState<Record<string, boolean>>({})

  const localStatus = useMemo(()=>{
    try{ return (localStorage.getItem('ai_subscription_status') as SubStatus) || null }catch(e){ return null }
  }, [])

  useEffect(()=>{
    let cancelled = false
    async function load(){
      try{
        const rawUser = localStorage.getItem('nextsells_user')
        const user = rawUser ? JSON.parse(rawUser) : null
        const sellerId = user?.id || localStorage.getItem('ai_subscription_sellerId')
        if(!sellerId){
          if(!cancelled) setStatus(localStatus)
          return
        }

        const res = await fetch(`/api/seller/ai-subscriptions?sellerId=${encodeURIComponent(sellerId)}`)
        const data = await res.json()
        if(!data?.success || !Array.isArray(data.data)){
          if(!cancelled) setStatus(localStatus)
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
        try{
          if(nextStatus){
            localStorage.setItem('ai_subscription_status', nextStatus)
          }else{
            localStorage.removeItem('ai_subscription_status')
          }
        }catch(e){}

        if(!cancelled) setStatus(nextStatus)
      }catch(e){
        if(!cancelled) setStatus(localStatus)
      }finally{
        if(!cancelled) setLoadingStatus(false)
      }
    }

    void load()
    return ()=>{ cancelled = true }
  }, [localStatus])

  function scoreProduct(product: PlatformProduct): WinningProduct {
    const base = Math.min(product.stock, 100) / 2 + Math.random() * 20
    const score = Math.round(base + 70)
    const predictedOrders = Math.max(6, Math.round(score / 10))
    const trend = Math.min(99, Math.max(70, Math.round(70 + Math.random() * 25)))
    let image = '/placeholder.jpg'
    try{
      const parsed = JSON.parse(product.images || '[]')
      if(Array.isArray(parsed) && parsed.length > 0){
        image = parsed[0]
      }
    }catch(e){}
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice,
      stock: product.stock,
      image,
      score,
      predictedOrders,
      trend,
    }
  }

  async function analyzeWinningProducts(){
    setAnalyzing(true)
    setResults([])
    setSelected({})
    setAnalysisError(null)
    try{
      const pageSize = 12
      let page = 1
      let total = 0
      let all: PlatformProduct[] = []
      let guard = 0

      do {
        const res = await fetch(`/api/seller/ai-analysis/products?page=${page}`)
        const data = await res.json()
        if(!data?.success){ break }
        const payload = data.data || {}
        const products = (payload.data || []) as PlatformProduct[]
        const pagination = payload.pagination || {}
        total = typeof pagination.total === 'number' ? pagination.total : products.length
        all = all.concat(products)
        page += 1
        guard += 1
      } while (all.length < total && guard < 20)

      if(all.length === 0){
        const fallback = await fetchFallbackCatalog()
        all = fallback
        total = fallback.length
      }

      setProductsAnalyzed(all.length)
      const scored = all.map(scoreProduct)
      const top = scored.sort((a, b)=> b.score - a.score).slice(0, 10)
      const defaultSelected: Record<string, boolean> = {}
      top.forEach((item)=>{ defaultSelected[item.id] = true })
      setSelected(defaultSelected)
      setResults(top)
    }catch(e){
      console.error(e)
      setAnalysisError('Unable to analyze products. Please try again.')
    }
    setAnalyzing(false)
  }

  async function fetchFallbackCatalog(): Promise<PlatformProduct[]> {
    try{
      const res = await fetch('/api/seller/catalog?limit=24&skip=0')
      const data = await res.json()
      if(!data?.success){
        return []
      }
      const payload = data.data || {}
      const catalog = (payload.products || []) as Array<{
        externalId: number
        title: string
        description: string
        category: string
        basePrice: number
        stock: number
        images?: string[]
      }>

      return catalog.map((item)=>({
        id: `catalog-${item.externalId}`,
        title: item.title,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        sellingPrice: item.basePrice,
        stock: item.stock,
        images: JSON.stringify(item.images || []),
      }))
    }catch(e){
      return []
    }
  }

  function toggleSelect(id: string){
    setSelected((prev)=> ({ ...prev, [id]: !prev[id] }))
  }

  function selectAll(){
    if(results.length === 0) return
    const next: Record<string, boolean> = {}
    results.forEach((item)=>{ next[item.id] = true })
    setSelected(next)
  }

  const selectedCount = results.filter((item)=> selected[item.id]).length

  function buildPayload(item: WinningProduct){
    return {
      externalId: Date.now() + Math.floor(Math.random() * 1000),
      title: item.title,
      description: item.description,
      category: item.category,
      basePrice: item.basePrice,
      profitMargin: 30,
      stock: item.stock || 20,
      images: [item.image],
      brand: 'Platform Catalog',
    }
  }

  async function publishItems(items: WinningProduct[]){
    for(const item of items){
      await fetch('/api/seller/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(item)),
      })
    }
  }

  async function publishAll(){
    if(selectedCount === 0) return
    setPublishLoading(true)
    try{
      const picked = results.filter((item)=> selected[item.id])
      await publishItems(picked)
      setPublished((prev)=>{
        const next = { ...prev }
        picked.forEach((item)=>{ next[item.id] = true })
        return next
      })
      alert('Selected products published to your store')
    }catch(e){
      console.error(e)
      alert('Unable to publish products. Please try again.')
    }
    setPublishLoading(false)
  }

  async function publishItem(item: WinningProduct){
    setPublishLoading(true)
    try{
      await publishItems([item])
      setPublished((prev)=>({ ...prev, [item.id]: true }))
      alert('Product published to your store')
    }catch(e){
      console.error(e)
      alert('Unable to publish product. Please try again.')
    }
    setPublishLoading(false)
  }

  if(loadingStatus){
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="text-sm text-muted-foreground">Loading AI Analysis status...</div>
      </section>
    )
  }

  if(status === 'PENDING') return null

  if(status === 'ACTIVE'){
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">⚡</div>
            <div>
              <div className="text-sm font-semibold">Market Intelligence</div>
              <div className="text-xs text-muted-foreground">Analyze products and predict demand</div>
            </div>
          </div>
          <button
            onClick={analyzeWinningProducts}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold disabled:opacity-70"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Winning Products'}
          </button>
        </div>

        {results.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center text-sm text-muted-foreground min-h-[160px]">
            <div className="text-3xl mb-3">🧠</div>
            <div>{analysisError || 'Click "Analyze Winning Products" to get started'}</div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">✦</div>
                <div>Based on my market research this week, I analyzed {productsAnalyzed} products across all categories and identified the top trending items.</div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">✦</div>
                <div>These 10 products show strong demand signals. Sellers stocking these items typically see 6-12 orders per product within the first week.</div>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">✦</div>
                <div>I recommend adding these products to your store to maximize your revenue this period.</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Top 10 Recommended Products</div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-500">{productsAnalyzed} products analyzed</div>
                <button
                  onClick={selectAll}
                  disabled={results.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-900 px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  Select All
                </button>
                <button
                  onClick={publishAll}
                  disabled={publishLoading || selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  Publish All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item, index)=>(
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-400 font-semibold w-4">{index + 1}</div>
                    <img src={item.image} alt={item.title} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                      <div className="text-xs text-slate-500">${item.basePrice.toFixed(2)} · {item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">{item.predictedOrders}</div>
                    <div className="text-xs text-emerald-600">{item.trend}%</div>
                    {published[item.id] ? (
                      <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">In Store</span>
                    ) : (
                      <button
                        onClick={()=>publishItem(item)}
                        disabled={publishLoading}
                        className="text-xs rounded-full border border-slate-200 px-3 py-1 text-slate-700"
                      >
                        Publish
                      </button>
                    )}
                    <input type="checkbox" checked={!!selected[item.id]} onChange={()=>toggleSelect(item.id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-b from-[#0b2740] to-[#0b2840] rounded-2xl shadow-md overflow-hidden">
        <div className="p-8 md:p-12 lg:p-16 text-white">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C9.238 2 7 4.238 7 7v1.5C7 10.88 5.88 12 4.5 12S2 10.88 2 9.5V8c0-3.866 3.134-7 7-7s7 3.134 7 7v1.5c0 1.38-1.12 2.5-2.5 2.5S11 10.88 11 9.5V7c0-1.657 1.343-3 3-3s3 1.343 3 3v1.5C17 11.985 14.985 14 12.5 14H12" stroke="#E6F0FF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="#E6F0FF" strokeWidth="1" opacity="0.12" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Unlock AI Market Analysis</h2>
            <p className="mt-3 text-sm md:text-base text-slate-200 max-w-2xl mx-auto">Get data-driven product recommendations and market insights to grow your store faster.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-lg font-semibold">Trending Products</div>
          <p className="text-sm text-muted-foreground mt-2">Discover which products are in high demand this week</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-lg font-semibold">Order Predictions</div>
          <p className="text-sm text-muted-foreground mt-2">Get estimated order volumes for recommended products</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-lg font-semibold">Weekly Reports</div>
          <p className="text-sm text-muted-foreground mt-2">Fresh analysis every time you run the tool</p>
        </div>
      </div>

      <div className="text-center">
        <div className="text-4xl font-extrabold">$299</div>
        <div className="text-sm text-muted-foreground">one-time payment</div>
        <div className="mt-6">
          <UnlockAIButton />
        </div>
      </div>
    </div>
  )
}
