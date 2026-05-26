import { requireRole } from '@/lib/auth/protectedRoutes';
import PaymentsManagement from '@/app/components/admin/PaymentsManagement';

export const metadata = {
  title: 'Withdrawal Requests - Nextsells Admin',
};

export default async function AdminPaymentsPage() {
  await requireRole(['admin']);
  return <PaymentsManagement />;
}
