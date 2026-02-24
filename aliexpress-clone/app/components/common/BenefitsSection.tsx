'use client';

import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

interface Benefit {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const benefits: Benefit[] = [
  {
    id: 1,
    icon: <Truck size={24} />,
    title: 'Free Shipping',
    subtitle: 'On orders over $50',
  },
  {
    id: 2,
    icon: <Shield size={24} />,
    title: 'Secure Payment',
    subtitle: '100% protected transactions',
  },
  {
    id: 3,
    icon: <RotateCcw size={24} />,
    title: 'Easy Returns',
    subtitle: '30-day hassle-free returns',
  },
  {
    id: 4,
    icon: <Headphones size={24} />,
    title: '24/7 Support',
    subtitle: 'Dedicated customer care',
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-gray-50 py-6 border-y border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="flex items-center gap-3"
            >
              <div className="text-blue-600 bg-blue-50 p-3 rounded-full flex-shrink-0">
                {benefit.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  {benefit.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {benefit.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
