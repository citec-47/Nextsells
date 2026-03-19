'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlatformBrand } from '@/app/hooks/usePlatformBrand';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Landmark,
  Eye,
  BarChart2,
  ChevronDown,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Sellers', href: '/admin/sellers', icon: Store },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Loans', href: '/admin/loans', icon: Landmark },
  { label: 'Visitors', href: '/admin/visitors', icon: Eye },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function readAdminFromStorage(): { name: string; initials: string } {
  const fallback = { name: 'Admin', initials: 'AA' };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem('nextsells_user');
    if (!raw) return fallback;
    const user = JSON.parse(raw) as { name?: string };
    const name = user?.name ?? 'Admin';
    const parts = name.trim().split(/\s+/);
    const initials = parts
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return { name, initials };
  } catch {
    return fallback;
  }
}

const DEFAULT_ADMIN = { name: 'Admin', initials: 'AA' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState(DEFAULT_ADMIN);
  const { platformName } = usePlatformBrand();
  const platformInitial = (platformName.trim()[0] || 'N').toUpperCase();

  useEffect(() => {
    setAdmin(readAdminFromStorage());
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-[#1e2140] flex flex-col fixed inset-y-0 left-0 z-20 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-base">
            {platformInitial}
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">{platformName}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user bar */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {admin.initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{admin.name}</p>
              <p className="text-gray-400 text-[10px]">Admin</p>
            </div>
          </div>
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Logout
          </Link>
        </div>
      </aside>

      {/* ── Right pane ── */}
      <div className="ml-56 flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b px-6 py-3 shrink-0 flex items-center justify-end gap-4">
          <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
              3
            </span>
          </button>
          <div className="flex items-center gap-2 cursor-pointer select-none">
            <div className="w-7 h-7 rounded-full bg-[#1e2140] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {admin.initials}
            </div>
            <span className="text-sm text-gray-700 font-medium">{admin.name}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
