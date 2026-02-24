'use client';

import { useUserRole } from '@/app/hooks/useUserRole';
import Link from 'next/link';

export default function RoleBasedNav() {
  const { isSeller, isAdmin, isBuyer } = useUserRole();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Nextsells
          </Link>

          <div className="flex gap-6">
            {/* Buyer Links */}
            {isBuyer && (
              <>
                <Link href="/buyer/products" className="text-gray-600 hover:text-blue-600">
                  Shop
                </Link>
                <Link href="/buyer/cart" className="text-gray-600 hover:text-blue-600">
                  Cart
                </Link>
                <Link href="/buyer/orders" className="text-gray-600 hover:text-blue-600">
                  Orders
                </Link>
              </>
            )}

            {/* Seller Links */}
            {isSeller && (
              <>
                <Link href="/seller/products" className="text-gray-600 hover:text-blue-600">
                  Products
                </Link>
                <Link href="/seller/dashboard" className="text-gray-600 hover:text-blue-600">
                  Dashboard
                </Link>
              </>
            )}

            {/* Admin Links */}
            {isAdmin && (
              <>
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-blue-600">
                  Admin
                </Link>
                <Link href="/admin/sellers" className="text-gray-600 hover:text-blue-600">
                  Sellers
                </Link>
              </>
            )}

            {/* Common Links */}
            <Link href="/profile" className="text-gray-600 hover:text-blue-600">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
