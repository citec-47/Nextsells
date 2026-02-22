'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
  textColor: string;
}

const slides: BannerSlide[] = [
  {
    id: 1,
    title: 'Super Sale',
    subtitle: 'Up to 70% off on electronics',
    buttonText: 'Shop Now',
    buttonLink: '/buyer/products',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-white',
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Discover the latest trends in fashion',
    buttonText: 'Explore',
    buttonLink: '/buyer/products',
    bgColor: 'bg-gradient-to-r from-orange-400 to-red-500',
    textColor: 'text-white',
  },
  {
    id: 3,
    title: 'Free Shipping',
    subtitle: 'On orders over $50 worldwide',
    buttonText: 'Learn More',
    buttonLink: '/buyer/products',
    bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textColor: 'text-white',
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative h-64 md:h-96 overflow-hidden rounded-lg"
      aria-label="Promotional banner carousel"
    >
      {/* Slide Content */}
      <div className={`${slide.bgColor} ${slide.textColor} h-full flex items-center justify-center px-8 transition-all duration-500`}>
        <div className="text-center max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {slide.title}
          </h2>
          <p className="text-lg md:text-xl mb-6 opacity-90">
            {slide.subtitle}
          </p>
          <Link
            href={slide.buttonLink}
            className="inline-block bg-white text-gray-900 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            {slide.buttonText}
          </Link>
        </div>
      </div>

      {/* Previous Button */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>

      {/* Next Button */}
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
        aria-label="Next slide"
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Slide indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === currentSlide}
            role="tab"
          />
        ))}
      </div>
    </section>
  );
}
