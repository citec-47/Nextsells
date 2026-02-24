'use client';

import Link from 'next/link';
import { Grid3x3, Sparkles, Package, Shirt, Home, Apple, Coffee, Laptop, ShoppingBag, Footprints, Watch } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  link: string;
}

const categories: Category[] = [
  { id: 'all', name: 'All', icon: <Grid3x3 className="w-5 h-5" />, link: '/buyer/products' },
  { id: 'beauty', name: 'Beauty', icon: <Sparkles className="w-5 h-5" />, link: '/buyer/products?category=beauty' },
  { id: 'fragrances', name: 'Fragrances', icon: <Package className="w-5 h-5" />, link: '/buyer/products?category=fragrances' },
  { id: 'furniture', name: 'Furniture', icon: <Home className="w-5 h-5" />, link: '/buyer/products?category=furniture' },
  { id: 'groceries', name: 'Groceries', icon: <Apple className="w-5 h-5" />, link: '/buyer/products?category=groceries' },
  { id: 'home-decoration', name: 'Home Decoration', icon: <Home className="w-5 h-5" />, link: '/buyer/products?category=home-decoration' },
  { id: 'kitchen', name: 'Kitchen Accessories', icon: <Coffee className="w-5 h-5" />, link: '/buyer/products?category=kitchen-accessories' },
  { id: 'laptops', name: 'Laptops', icon: <Laptop className="w-5 h-5" />, link: '/buyer/products?category=laptops' },
  { id: 'mens-shirts', name: 'Mens Shirts', icon: <Shirt className="w-5 h-5" />, link: '/buyer/products?category=mens-shirts' },
  { id: 'mens-shoes', name: 'Mens Shoes', icon: <Footprints className="w-5 h-5" />, link: '/buyer/products?category=mens-shoes' },
  { id: 'mens-watches', name: 'Mens Watches', icon: <Watch className="w-5 h-5" />, link: '/buyer/products?category=mens-watches' },
];

export default function CategoryNav() {
  return (
    <section className="sticky top-16 md:top-[72px] z-40 w-full left-0 right-0 bg-white/95 backdrop-blur py-2.5 md:py-4 border-b border-gray-200 shadow-sm" aria-label="Product categories">
      <div className="w-full px-2 sm:px-4">
        <nav>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide md:justify-between">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.link}
                className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-fit hover:opacity-75 transition-opacity group"
                aria-label={`Browse ${category.name}`}
              >
                <div className="text-gray-700 group-hover:text-blue-600 transition-colors" aria-hidden="true">
                  {category.icon}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors whitespace-nowrap">
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
