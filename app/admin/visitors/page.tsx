import { requireRole } from '@/lib/auth/protectedRoutes';
import VisitorsManagement from '@/app/components/admin/VisitorsManagement';

export const metadata = {
  title: 'Visitors - Nextsells Admin',
};

export default async function AdminVisitorsPage() {
  await requireRole(['admin']);
  return <VisitorsManagement />;
}