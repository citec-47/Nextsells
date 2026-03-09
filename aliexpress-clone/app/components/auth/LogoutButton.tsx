/**
 * Auth0 Logout Button Component
 * Located at: app/components/auth/LogoutButton.tsx
 * 
 * Reusable logout button component for your app
 */

'use client';

import { useRouter } from 'next/navigation';
import { getLogoutUrl } from '@/lib/auth/auth0Client';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className = '', children = 'Sign Out' }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    router.push(getLogoutUrl('/'));
  };

  return (
    <button
      onClick={handleLogout}
      className={className || 'px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'}
    >
      {children}
    </button>
  );
}
