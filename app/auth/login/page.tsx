import { Suspense } from 'react';
import LoginPage from '@/app/components/auth/LoginPage';

export const metadata = {
  title: 'Sign In - MarketHub',
  description: 'Sign in to your MarketHub account',
};

export default function Login() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-600">Loading login...</div>}>
      <LoginPage />
    </Suspense>
  );
}
