import { requireRole } from '@/lib/auth/protectedRoutes';
import BuyerMessagesPage from '@/app/components/buyer/BuyerMessagesPage';

export const metadata = {
  title: 'Messages | Nextsells Buyer',
  description: 'Chat with sellers about your orders',
};

export default async function BuyerMessagesRoutePage() {
  await requireRole(['buyer']);
  return <BuyerMessagesPage />;
}
