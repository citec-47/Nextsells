import { requireRole } from '@/lib/auth/protectedRoutes';
import MyStorePage from '@/app/components/seller/MyStorePage';

export const metadata = {
  title: 'My Store | Nextsells',
  description: 'View your store and all selected products',
};

export default async function SellerStorePage() {
  await requireRole(['seller']);
  return <MyStorePage />;
}
