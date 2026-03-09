import { requireRole } from '@/lib/auth/protectedRoutes';
import SellerApprovalDashboard from '@/app/components/admin/SellerApprovalDashboard';

export const metadata = {
  title: 'Seller Approvals - Admin Dashboard',
  description: 'Review and approve pending seller applications',
};

export default async function AdminSellerApprovalsPage() {
  // Require admin role to access seller approvals
  await requireRole(['admin']);
  
  return <SellerApprovalDashboard />;
}
