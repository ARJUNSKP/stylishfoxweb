"use client";
import React, { useState, useEffect } from 'react';
import { fetchActiveCarousel, formatProductImageUrl, CarouselItem } from '@/utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fallbackBannerImages = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=2000"
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselData, setCarouselData] = useState<CarouselItem | null>(null);

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchActiveCarousel()
      .then((data) => {
        if (data && data.images && data.images.length > 0) {
          setCarouselData(data);
        }
      })
      .catch(() => {});
  }, []);

  const bannerImages =
    carouselData && carouselData.images && carouselData.images.length > 0
      ? carouselData.images.map((img) => formatProductImageUrl(img))
      : fallbackBannerImages;

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
  };

  return (
    <section className="relative w-full h-[50vh] md:h-[70vh] bg-black flex items-center justify-center overflow-hidden group">
      {/* Carousel Images */}
      {bannerImages.map((src, index) => (
        <div 
          key={`${src}-${index}`}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <div 
            className="w-full h-full bg-cover md:bg-[center_top_-4rem] bg-center transition-transform duration-10000 ease-linear"
            style={{ backgroundImage: `url('${src}')` }}
          />
        </div>
      ))}

      {/* Title & Description Overlay if provided */}
      {carouselData && (carouselData.title || carouselData.description) && (
        <div className="absolute inset-0 z-15 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12 pointer-events-none">
          <div className="max-w-2xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef08a] text-black text-[10px] font-black uppercase tracking-wider mb-2">
              Featured Collection
            </span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
              {carouselData.title}
            </h2>
            {carouselData.description && (
              <p className="text-xs md:text-sm text-zinc-300 mt-1 max-w-lg line-clamp-2 drop-shadow">
                {carouselData.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {bannerImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 z-25 p-2 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 z-25 p-2 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* Dots Indicator */}
      {bannerImages.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 flex gap-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${index === currentIndex ? 'bg-[#fef08a] w-8' : 'bg-white/50 w-2 hover:bg-white'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
