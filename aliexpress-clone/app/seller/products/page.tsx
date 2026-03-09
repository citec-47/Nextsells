import { requireRole } from '@/lib/auth/protectedRoutes';
import ProductListingForm from '@/app/components/seller/ProductListingForm';

export const metadata = {
  title: 'List Product - NextSells Seller',
  description: 'Create and list a new product with profit margins',
};

export default async function ProductListingPage() {
  // Require seller role to list products
  await requireRole(['seller']);
  
  return <ProductListingForm />;
}
