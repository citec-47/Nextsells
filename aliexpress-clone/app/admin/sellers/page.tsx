import { requireRole } from '@/lib/auth/protectedRoutes';
import SellersManagement from '@/app/components/admin/SellersManagement';

export const metadata = {
  title: 'Manage Sellers - Nextsells Admin',
};

export default async function AdminSellersPage() {
  await requireRole(['admin']);
  return <SellersManagement />;
}
