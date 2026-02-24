'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useShopState } from './ShopStateProvider';

interface ApiProduct {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
  images: string[];
  category: string;
  tags?: string[];
  brand?: string;
  video?: string;
}


const categorySections = [
  { key: 'phones', label: 'Phones', apiCategory: 'smartphones' },
  { key: 'electronics', label: 'Electronics', apiCategory: 'laptops' },
  { key: 'fashion', label: 'Fashion', apiCategory: 'mens-shirts' },
  { key: 'home', label: 'Home', apiCategory: 'home-decoration' },
  { key: 'kitchen', label: 'Kitchen', apiCategory: 'kitchen-accessories' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const buildDiscountLabel = (discountPercentage: number) => {
  const discount = Math.round(discountPercentage);
  if (discount >= 30) return `Hot Deal -${discount}%`;
  if (discount >= 10) return `New -${discount}%`;
  return null;
};

export default function HomeProductShowcase() {
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<Record<string, ApiProduct[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addToCart, toggleWishlist, wishlistItems } = useShopState();
  const [hoveredImageIndex, setHoveredImageIndex] = useState<Record<number, number>>({});
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const hoverIntervals = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchSections = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const results = await Promise.all(
          categorySections.map(async (section) => {
            const response = await fetch(
              `https://dummyjson.com/products/category/${section.apiCategory}?limit=8`
            );
            if (!response.ok) {
              throw new Error(`Failed to load ${section.label} products`);
            }
            const data = (await response.json()) as { products: ApiProduct[] };
            return [section.key, data.products ?? []] as const;
          })
        );

        if (isMounted) {
          const nextSections: Record<string, ApiProduct[]> = {};
          results.forEach(([key, products]) => {
            nextSections[key] = products;
          });
          setSections(nextSections);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load products.';
          setError(message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSections();

    return () => {
      isMounted = false;
      Object.values(hoverIntervals.current).forEach((intervalId) => clearInterval(intervalId));
      hoverIntervals.current = {};
    };
  }, []);

  const handleAddToCart = (product: ApiProduct) => {
    addToCart(product);
  };

  const handleToggleWishlist = (product: ApiProduct) => {
    toggleWishlist(product);
  };

  const handleOpenModal = (product: ApiProduct, image?: string) => {
    setSelectedProduct(product);
    setSelectedImage(image ?? product.images[0] ?? product.thumbnail);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedImage(null);
  };

  const handleHoverStart = (product: ApiProduct) => {
    setHoveredProductId(product.id);
    if (!product.images || product.images.length < 2) return;
    if (hoverIntervals.current[product.id]) return;

    let index = 0;
    setHoveredImageIndex((prev) => ({ ...prev, [product.id]: index }));
    hoverIntervals.current[product.id] = setInterval(() => {
      index = (index + 1) % product.images.length;
      setHoveredImageIndex((prev) => ({ ...prev, [product.id]: index }));
    }, 1200);
  };

  const handleHoverEnd = (product: ApiProduct) => {
    setHoveredProductId((prev) => (prev === product.id ? null : prev));
    const intervalId = hoverIntervals.current[product.id];
    if (intervalId) {
      clearInterval(intervalId);
      delete hoverIntervals.current[product.id];
    }
    setHoveredImageIndex((prev) => {
      const next = { ...prev };
      delete next[product.id];
      return next;
    });
  };

  return (
    <section className="py-3 md:py-10" aria-labelledby="homepage-products">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-8">
          <div>
            <h2 id="homepage-products" className="text-base md:text-2xl lg:text-3xl font-bold text-gray-900">
              Shop the latest picks
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-48 md:h-72 rounded-lg md:rounded-2xl bg-white border border-gray-100 shadow animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 md:p-6 rounded-lg md:rounded-2xl text-xs md:text-base">
            {error}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-10">
            {categorySections.map((section) => {
              const products = sections[section.key] ?? [];
              if (!products.length) return null;

              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <Link
                      href={`/buyer/products?category=${section.key}`}
                      className="text-sm md:text-xl lg:text-2xl font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                      aria-label={`Browse ${section.label} products`}
                    >
                      {section.label}
                    </Link>
                    <span className="text-[10px] md:text-sm text-gray-500">
                      {products.length} items
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-5">
                    {products.map((product) => {
                      const discountLabel = buildDiscountLabel(product.discountPercentage);
                      const showTopSeller = product.rating >= 4.7;

                      return (
                        <article
                          key={product.id}
                          className="bg-white rounded-lg md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full"
                          onMouseEnter={() => handleHoverStart(product)}
                          onMouseLeave={() => handleHoverEnd(product)}
                        >
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(product, product.images[0])}
                              className="block w-full"
                              aria-label={`Open ${product.title} image preview`}
                            >
                              {product.video && hoveredProductId === product.id ? (
                                <video
                                  src={product.video}
                                  className="h-28 sm:h-32 md:h-44 w-full object-cover"
                                  muted
                                  autoPlay
                                  loop
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={
                                    product.images?.[hoveredImageIndex[product.id] ?? 0] ??
                                    product.thumbnail
                                  }
                                  alt={product.title}
                                  loading="lazy"
                                  className="h-28 sm:h-32 md:h-44 w-full object-cover"
                                />
                              )}
                            </button>

                            {showTopSeller && (
                              <span className="hidden sm:inline-block absolute top-2 md:top-3 left-2 md:left-3 bg-black/80 text-white text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                                Top Seller
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleWishlist(product)}
                              className={`absolute bottom-1.5 md:bottom-3 left-1.5 md:left-3 h-6 w-6 md:h-9 md:w-9 rounded-full flex items-center justify-center border transition-colors ${
                                wishlistItems.some((item) => item.id === product.id)
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'bg-white/90 border-gray-200 text-gray-600 hover:bg-rose-50'
                              }`}
                              aria-label={`Toggle wishlist for ${product.title}`}
                            >
                              <Heart size={12} className="md:w-4 md:h-4" aria-hidden="true" />
                            </button>

                            <div className="absolute top-1.5 md:top-3 right-1.5 md:right-3 flex flex-col gap-1 md:gap-2 items-end">
                              {discountLabel && (
                                <span className="bg-orange-500 text-white text-[9px] md:text-xs font-semibold px-1 md:px-2 py-0.5 md:py-1 rounded-full">
                                  {discountLabel}
                                </span>
                              )}
                              {product.tags?.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="hidden md:inline-block bg-white/90 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full border"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-1.5 sm:p-3 md:p-4 space-y-1 md:space-y-3 flex flex-col flex-1">
                            <div className="flex-1">
                              <p className="hidden sm:block text-[10px] sm:text-xs md:text-sm text-orange-600 font-medium uppercase">
                                {product.category.replace('-', ' ')}
                              </p>
                              <h4 className="text-[10px] sm:text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                                {product.title}
                              </h4>
                              <p className="hidden sm:block text-[10px] sm:text-xs text-gray-500">{product.brand ?? 'Popular pick'}</p>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <div>
                                <p className="text-xs sm:text-base md:text-lg font-bold text-gray-900">
                                  {currencyFormatter.format(product.price)}
                                </p>
                                <p className="hidden sm:block text-[10px] sm:text-xs text-gray-500">Rating {product.rating.toFixed(1)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                className="inline-flex items-center gap-0.5 md:gap-2 bg-orange-500 text-white text-[9px] sm:text-xs md:text-sm font-semibold px-1.5 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-orange-600 transition-colors flex-shrink-0"
                                aria-label={`Add ${product.title} to cart`}
                              >
                                <ShoppingCart size={12} className="md:w-4 md:h-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Add</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProduct.title} image preview`}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="text-xs text-orange-600 uppercase">{selectedProduct.category}</p>
                <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.title}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Close image preview"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 p-5">
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                <img src={selectedImage} alt={selectedProduct.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">{selectedProduct.brand ?? 'Featured brand'}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {currencyFormatter.format(selectedProduct.price)}
                  </span>
                  {buildDiscountLabel(selectedProduct.discountPercentage) && (
                    <span className="text-sm font-semibold text-orange-600">
                      {buildDiscountLabel(selectedProduct.discountPercentage)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Rating {selectedProduct.rating.toFixed(1)}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.images.slice(0, 4).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-16 w-16 rounded-lg overflow-hidden border ${
                        image === selectedImage ? 'border-orange-500' : 'border-gray-200'
                      }`}
                      aria-label="View product image"
                    >
                      <img src={image} alt="Product preview" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleWishlist(selectedProduct)}
                  className={`w-full border font-semibold py-3 rounded-lg transition-colors ${
                    wishlistItems.some((item) => item.id === selectedProduct.id)
                      ? 'border-rose-500 text-rose-600 hover:bg-rose-50'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {wishlistItems.some((item) => item.id === selectedProduct.id)
                    ? 'Saved to Wishlist'
                    : 'Save to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
