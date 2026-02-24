'use client';

import Link from 'next/link';
import { Zap, Sparkles, Award } from 'lucide-react';

interface Banner {
  id: number;
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonColor: string;
  bgColor: string;
  textColor: string;
  link: string;
}

const banners: Banner[] = [
  {
    id: 1,
    badge: 'Electronics',
    badgeIcon: <Zap size={14} />,
    title: 'Electronics Sale',
    subtitle: 'Up to 60% Off',
    buttonText: 'Shop Now →',
    buttonColor: 'text-blue-400',
    bgColor: 'bg-gradient-to-br from-blue-700 to-blue-900',
    textColor: 'text-white',
    link: '/buyer/products?category=laptops',
  },
  {
    id: 2,
    badge: 'Just In',
    badgeIcon: <Sparkles size={14} />,
    title: 'New Arrivals',
    subtitle: 'Fresh Picks Every Day',
    buttonText: 'Discover →',
    buttonColor: 'text-yellow-400',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-700',
    textColor: 'text-white',
    link: '/buyer/products',
  },
  {
    id: 3,
    badge: 'Featured',
    badgeIcon: <Award size={14} />,
    title: 'Seller Spotlight',
    subtitle: 'Top-Rated Vendors',
    buttonText: 'Browse →',
    buttonColor: 'text-purple-400',
    bgColor: 'bg-gradient-to-br from-purple-900 to-indigo-900',
    textColor: 'text-white',
    link: '/buyer/products',
  },
];

export default function PromotionalBanners() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.link}
          className={`${banner.bgColor} ${banner.textColor} rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all transform hover:scale-[1.02] flex flex-col justify-between min-h-[180px]`}
        >
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium mb-4">
              {banner.badgeIcon}
              <span>{banner.badge}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              {banner.title}
            </h3>
            <p className="text-base md:text-lg opacity-90 mb-4">
              {banner.subtitle}
            </p>
          </div>
          <div>
            <span className={`${banner.buttonColor} font-semibold text-sm hover:opacity-80 transition-opacity inline-flex items-center gap-1`}>
              {banner.buttonText}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
