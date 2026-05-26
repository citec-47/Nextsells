import SellerPendingBanner from '@/app/components/seller/SellerPendingBanner'
import SellerAIAnalysisPanel from '@/app/components/seller/SellerAIAnalysisPanel'
import SellerAIStatusBadge from '@/app/components/seller/SellerAIStatusBadge'

export const metadata = {
  title: 'AI Analysis - Seller',
}

export default function AnalysisPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">AI Market Analysis</h1>
            <SellerAIStatusBadge />
          </div>
          <p className="text-sm text-muted-foreground">Discover winning products and trends for your store</p>
        </header>

        <SellerPendingBanner />

        <SellerAIAnalysisPanel />

      </div>
    </div>
  )
}
