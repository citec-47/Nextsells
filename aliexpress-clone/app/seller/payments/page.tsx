import { requireRole } from '@/lib/auth/protectedRoutes';
import SellerPaymentsPage from '@/app/components/seller/SellerPaymentsPage';

export const metadata = {
  title: 'Payments | Nextsells Seller',
  description: 'Track seller balance and payout history',
};

export default async function SellerPaymentsRoutePage() {
  await requireRole(['seller']);
  return <SellerPaymentsPage />;
}
