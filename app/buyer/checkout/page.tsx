import { requireAuth } from '@/lib/auth/protectedRoutes';
import CheckoutComponent from '@/app/components/buyer/CheckoutPage';

export const metadata = {
  title: 'Checkout - NextSells',
  description: 'Complete your purchase with secure payment and fund holding',
};

export default async function CheckoutPage() {
  // Require authentication to checkout
  await requireAuth();
  
  return <CheckoutComponent />;
}
