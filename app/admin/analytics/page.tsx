import { requireRole } from '@/lib/auth/protectedRoutes';
import AnalyticsManagement from '@/app/components/admin/AnalyticsManagement';

export const metadata = {
  title: 'Analytics - Nextsells Admin',
};

export default async function AdminAnalyticsPage() {
  await requireRole(['admin']);
  return <AnalyticsManagement />;
}