import { requireRole } from '@/lib/auth/protectedRoutes';
import LoansManagement from '@/app/components/admin/LoansManagement';

export const metadata = {
  title: 'Loan Management - Nextsells Admin',
};

export default async function AdminLoansPage() {
  await requireRole(['admin']);
  return <LoansManagement />;
}
