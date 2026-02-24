import { requireRole } from '@/lib/auth/protectedRoutes';
import AdminApprovalDashboard from '@/app/components/admin/ApprovalDashboard';

export const metadata = {
  title: 'Admin Dashboard - Seller Approvals',
  description: 'Review and approve seller applications',
};

export default async function AdminDashboardPage() {
  await requireRole(['admin']);
  
  return <AdminApprovalDashboard />;
}
