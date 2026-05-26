import { requireRole } from '@/lib/auth/protectedRoutes';
import MessagesManagement from '@/app/components/admin/MessagesManagement';

export const metadata = {
  title: 'Messages - Nextsells Admin',
};

export default async function AdminMessagesPage() {
  await requireRole(['admin']);
  return <MessagesManagement />;
}
