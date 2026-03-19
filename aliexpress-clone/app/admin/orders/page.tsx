import { requireRole } from '@/lib/auth/protectedRoutes';
import OrdersManagement from '@/app/components/admin/OrdersManagement';

export const metadata = {
  title: 'Order Management - Nextsells Admin',
};

export default async function AdminOrdersPage() {
  await requireRole(['admin']);
  return <OrdersManagement />;
}
