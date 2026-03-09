import { requireAuth } from '@/lib/auth/protectedRoutes';
import SellerOnboardingForm from '@/app/components/seller/OnboardingForm';

export const metadata = {
  title: 'Seller Onboarding - NextSells',
  description: 'Complete your seller profile and get approved to start selling',
};

export default async function SellerOnboardingPage() {
  // Require authentication to access onboarding
  await requireAuth();
  
  return <SellerOnboardingForm />;
}
