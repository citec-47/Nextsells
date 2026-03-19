import { requireRole } from '@/lib/auth/protectedRoutes';
import SettingsManagement from '@/app/components/admin/SettingsManagement';

export const metadata = {
  title: 'Settings - Nextsells Admin',
};

export default async function AdminSettingsPage() {
  await requireRole(['admin']);
  return <SettingsManagement />;
}