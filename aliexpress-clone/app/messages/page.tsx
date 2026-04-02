import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/protectedRoutes';

export const metadata = {
  title: 'Messages | Nextsells',
};

export default async function MessagesEntryPage() {
  const session = await requireAuth();
  const role = String(session.user.role || '').toLowerCase();

  if (role === 'admin') {
    redirect('/admin/messages');
  }

  if (role === 'seller') {
    redirect('/seller/messages');
  }

  if (role === 'buyer') {
    redirect('/buyer/messages');
  }

  redirect('/unauthorized');
}
