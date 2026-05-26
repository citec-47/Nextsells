import { requireRole } from '@/lib/auth/protectedRoutes';
import UsersManagement from '@/app/components/admin/UsersManagement';

export const metadata = {
  title: 'User Management - Nextsells Admin',
};

export default async function AdminUsersPage() {
  await requireRole(['admin']);
  return <UsersManagement />;
}
