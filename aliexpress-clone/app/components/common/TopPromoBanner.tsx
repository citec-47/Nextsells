'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function TopPromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white py-2.5 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-orange-400">📦</span>
            <span className="font-medium">Free Shipping</span>
            <span className="hidden sm:inline">on Orders Over $50</span>
          </span>
          <span className="text-white/40">|</span>
          <span className="flex items-center gap-1.5">
            <span>New Sellers Welcome —</span>
            <Link 
              href="/seller/onboarding" 
              className="font-semibold underline hover:text-yellow-400 transition-colors inline-flex items-center gap-1"
            >
              Join Today →
            </Link>
          </span>
        </div>
      </div>
      
      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
        aria-label="Close banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
