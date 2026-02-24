'use client';

import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  ShoppingBag,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Phones',
    icon: <Smartphone className="w-8 h-8" />,
    link: '/buyer/products?category=phones',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: '2',
    name: 'Electronics',
    icon: <Laptop className="w-8 h-8" />,
    link: '/buyer/products?category=electronics',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: '3',
    name: 'Fashion',
    icon: <Shirt className="w-8 h-8" />,
    link: '/buyer/products?category=fashion',
    color: 'from-pink-400 to-pink-600',
  },
  {
    id: '4',
    name: 'Home & Garden',
    icon: <Home className="w-8 h-8" />,
    link: '/buyer/products?category=home',
    color: 'from-green-400 to-green-600',
  },
  {
    id: '5',
    name: 'Sports',
    icon: <Dumbbell className="w-8 h-8" />,
    link: '/buyer/products?category=sports',
    color: 'from-red-400 to-red-600',
  },
  {
    id: '6',
    name: 'Bags & More',
    icon: <ShoppingBag className="w-8 h-8" />,
    link: '/buyer/products?category=bags',
    color: 'from-orange-400 to-orange-600',
  },
];

export default function CategoryCardsSection() {
  return (
    <section className="py-10 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 text-center">
          Shop by Category
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.link}
              className={`bg-gradient-to-br ${category.color} text-white rounded-xl p-5 md:p-6 hover:shadow-xl transition-all transform hover:scale-105 flex flex-col items-center justify-center text-center group`}
            >
              <div className="group-hover:scale-110 transition-transform duration-300 mb-3">
                {category.icon}
              </div>
              <h3 className="font-semibold text-sm md:text-base line-clamp-2">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
