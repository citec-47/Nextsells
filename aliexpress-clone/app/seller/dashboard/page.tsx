import { requireRole } from '@/lib/auth/protectedRoutes';
import SellerDashboard from '@/app/components/seller/SellerDashboard';

export const metadata = {
  title: 'Seller Dashboard | Nextsells',
};

export default async function SellerDashboardPage() {
  await requireRole(['seller']);

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerDashboard />
    </div>
  );
}
