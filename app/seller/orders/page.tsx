import { requireRole } from '@/lib/auth/protectedRoutes';
import SellerOrdersPage from '@/app/components/seller/SellerOrdersPage';

export const metadata = {
  title: 'Orders | Nextsells Seller',
  description: 'View and track your seller orders',
};

export default async function SellerOrdersRoutePage() {
  await requireRole(['seller']);
  return <SellerOrdersPage />;
}
