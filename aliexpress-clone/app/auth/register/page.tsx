import { Suspense } from 'react';
import RoleBasedRegistrationFlow from '@/app/components/auth/RoleBasedRegistrationFlow';

export const metadata = {
  title: 'Register - Ali Express Clone',
  description: 'Complete your registration',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading registration...</div>}>
      <RoleBasedRegistrationFlow />
    </Suspense>
  );
}
