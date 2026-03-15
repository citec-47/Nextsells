import { requireAuth } from '@/lib/auth/protectedRoutes';
import SellerDashboard from '@/app/components/seller/SellerDashboard';

export const metadata = {
  title: 'Seller Dashboard | Nextsells',
  description: 'Manage your products and sales',
};

export default async function SellerDashboardPage() {
  // Require authentication to access this page
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerDashboard />
    </div>
  );
}
