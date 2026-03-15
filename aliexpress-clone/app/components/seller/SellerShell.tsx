'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Shield,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { usePlatformBrand } from '@/app/hooks/usePlatformBrand';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/seller/dashboard' },
  { icon: Store, label: 'My Store', href: '/seller/store' },
  { icon: Plus, label: 'Add Products', href: '/seller/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
  { icon: CreditCard, label: 'Payments', href: '/seller/payments' },
  { icon: MessageSquare, label: 'Messages', href: '/seller/messages' },
];

const HIDDEN_SHELL_ROUTES = new Set(['/seller/register', '/seller/onboarding', '/seller/pending']);

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth0User();
  const { platformName } = usePlatformBrand();

  if (HIDDEN_SHELL_ROUTES.has(pathname)) {
    return <>{children}</>;
  }

  const firstName = user?.name?.split(' ')[0] || 'Seller';
  const brandIsHub = platformName.endsWith('Hub');
  const brandHead = brandIsHub ? platformName.slice(0, -3) : platformName;

  return (
    <div className="flex min-h-screen bg-[#edf1f7] text-slate-900">
      <aside className="hidden w-[224px] flex-col bg-[#1f456d] text-white shadow-lg lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#1f456d]">
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-[24px] font-bold leading-none tracking-tight">
              <span className="text-white">{brandHead}</span>
              {brandIsHub ? <span className="text-amber-400">Hub</span> : null}
            </h1>
          </div>
        </div>

        <nav className="mt-4 space-y-1 px-2.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/seller/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  active ? 'bg-white text-[#173b62]' : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.name || 'User'} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
            )}
            <div className="flex-1">
              <p className="truncate text-sm font-semibold leading-none tracking-tight text-white">{user?.name || 'Seller'}</p>
              <div className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Seller
              </div>
            </div>
          </div>
          <Link
            href="/auth/logout"
            className="mt-3 inline-flex items-center gap-2 text-xs text-white/75 transition-colors hover:text-white"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-5">
            <button className="text-slate-500 transition-colors hover:text-slate-700" type="button" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f456d] text-sm font-semibold text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <p className="text-sm font-semibold text-slate-700">{firstName}</p>
                <ChevronDown size={14} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
