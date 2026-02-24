import SellerApprovalDashboard from '@/app/components/admin/SellerApprovalDashboard';

export const metadata = {
  title: 'Seller Approvals - Admin Dashboard',
  description: 'Review and approve pending seller applications',
};

export default function AdminSellerApprovalsPage() {
  return <SellerApprovalDashboard />;
}
