import ShopPageModern from '@/app/components/buyer/ShopPageModern';
import ModernHeader from '@/app/components/common/ModernHeader';

export const metadata = {
  title: 'Shop Products - NextSells',
  description: 'Browse and shop from thousands of products',
};

export default function BuyerProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      <ShopPageModern />
    </div>
  );
}
