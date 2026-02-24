'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface BannerSlide {
  id: number;
  badge: string;
  emoji: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgGradient: string;
}

const slides: BannerSlide[] = [
  {
    id: 1,
    badge: 'New Arrivals',
    emoji: '📱',
    title: 'Latest Electronics',
    subtitle: 'Cutting-edge gadgets at prices that beat the competition',
    buttonText: 'Explore Deals',
    buttonLink: '/buyer/products',
    bgGradient: 'bg-gradient-to-br from-[#1e3a5f] via-[#2a4a6f] to-[#1e3a5f]',
  },
  {
    id: 2,
    badge: 'Limited Time',
    emoji: '☀️',
    title: 'Summer Mega Sale',
    subtitle: 'Up to 70% off on thousands of products from verified sellers',
    buttonText: 'Shop Now',
    buttonLink: '/buyer/products',
    bgGradient: 'bg-gradient-to-br from-[#1e3a5f] via-[#2d4a70] to-[#1e3a5f]',
  },
  {
    id: 3,
    badge: 'Trending Now',
    emoji: '👗',
    title: 'Fashion Forward',
    subtitle: 'Trending styles from top sellers around the world',
    buttonText: 'Discover More',
    buttonLink: '/buyer/products',
    bgGradient: 'bg-gradient-to-br from-[#6b46c1] via-[#7c3aed] to-[#6b46c1]',
  },
  {
    id: 4,
    badge: 'Top Picks',
    emoji: '🏠',
    title: 'Home & Living',
    subtitle: 'Transform your space with premium decor and furniture',
    buttonText: 'Browse Collection',
    buttonLink: '/buyer/products',
    bgGradient: 'bg-gradient-to-br from-[#0f766e] via-[#14b8a6] to-[#0f766e]',
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden"
      aria-label="Promotional banner carousel"
    >
      {/* Slide Content */}
      <div className={`${slide.bgGradient} h-full flex items-center justify-center px-4 sm:px-6 md:px-8 transition-all duration-700 ease-in-out`}>
        <div className="container mx-auto">
          <div className="max-w-3xl text-white">
            {/* Badge */}
            <div className="mb-4 sm:mb-6">
              <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-white border border-white/30">
                {slide.badge}
              </span>
            </div>

            {/* Title with Emoji */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 flex items-center gap-3 sm:gap-4">
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl">{slide.emoji}</span>
              <span className="leading-tight">{slide.title}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-white/90 max-w-2xl">
              {slide.subtitle}
            </p>

            {/* CTA Button */}
            <Link
              href={slide.buttonLink}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold text-sm sm:text-base rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {slide.buttonText}
              <ArrowRight size={18} className="sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-300 border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
      </button>

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-black/30 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-white/20">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3" role="tablist" aria-label="Slide indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === index
                ? 'w-8 sm:w-10 h-2 sm:h-2.5 bg-white'
                : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/60'
            }`}
            role="tab"
            aria-selected={currentSlide === index}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
