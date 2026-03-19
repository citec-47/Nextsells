'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clearLocalAuthSession } from '@/lib/auth/auth0Client';

export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    clearLocalAuthSession();

    // Clear the server-side HttpOnly cookie as well
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      const returnTo = searchParams.get('returnTo') || '/';
      router.replace(returnTo);
      router.refresh();
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">Signing you out...</p>
      </div>
    </div>
  );
}