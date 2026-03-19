import { requireRole } from '@/lib/auth/protectedRoutes';
import AdminDashboard from '@/app/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard - Nextsells',
  description: 'Admin panel for managing the Nextsells platform',
};

export default async function AdminDashboardPage() {
  await requireRole(['admin']);

  return <AdminDashboard />;
}
