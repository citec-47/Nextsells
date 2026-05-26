import { requireRole } from '@/lib/auth/protectedRoutes';
import SellerMessagesPage from '@/app/components/seller/SellerMessagesPage';

export const metadata = {
  title: 'Messages | Nextsells Seller',
  description: 'Send and receive seller messages',
};

export default async function SellerMessagesRoutePage() {
  await requireRole(['seller']);
  return <SellerMessagesPage />;
}
