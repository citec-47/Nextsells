import { requireAuth } from '@/lib/auth/protectedRoutes';
import CartPage from '../../components/buyer/CartPage';

export const metadata = {
  title: 'Shopping Cart | Nextsells',
  description: 'Review your cart items',
};

export default async function Cart() {
  // Require authentication to view cart
  await requireAuth();
  
  return <CartPage />;
}
