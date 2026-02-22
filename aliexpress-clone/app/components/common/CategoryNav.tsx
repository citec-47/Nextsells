'use client';

import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  Book,
  Baby,
  Gamepad2,
  Watch,
  Headphones,
  Package,
  Gift,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  link: string;
}

const categories: Category[] = [
  { id: '1', name: 'Phones', icon: <Smartphone size={32} />, link: '/buyer/products?category=phones' },
  { id: '2', name: 'Electronics', icon: <Laptop size={32} />, link: '/buyer/products?category=electronics' },
  { id: '3', name: 'Fashion', icon: <Shirt size={32} />, link: '/buyer/products?category=fashion' },
  { id: '4', name: 'Home', icon: <Home size={32} />, link: '/buyer/products?category=home' },
  { id: '5', name: 'Sports', icon: <Dumbbell size={32} />, link: '/buyer/products?category=sports' },
  { id: '6', name: 'Books', icon: <Book size={32} />, link: '/buyer/products?category=books' },
  { id: '7', name: 'Baby', icon: <Baby size={32} />, link: '/buyer/products?category=baby' },
  { id: '8', name: 'Gaming', icon: <Gamepad2 size={32} />, link: '/buyer/products?category=gaming' },
  { id: '9', name: 'Watches', icon: <Watch size={32} />, link: '/buyer/products?category=watches' },
  { id: '10', name: 'Audio', icon: <Headphones size={32} />, link: '/buyer/products?category=audio' },
  { id: '11', name: 'Gifts', icon: <Gift size={32} />, link: '/buyer/products?category=gifts' },
  { id: '12', name: 'More', icon: <Package size={32} />, link: '/buyer/products' },
];

export default function CategoryNav() {
  return (
    <section className="bg-white py-6 border-b" aria-label="Product categories">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800">
          Shop by Category
        </h2>
        <nav>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.link}
                className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-orange-50 hover:shadow-md transition-all group"
                aria-label={`Browse ${category.name}`}
              >
                <div className="text-orange-500 group-hover:text-orange-600 group-hover:scale-110 transition-transform mb-2" aria-hidden="true">
                  {category.icon}
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
