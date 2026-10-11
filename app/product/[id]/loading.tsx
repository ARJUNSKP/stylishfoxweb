import React from 'react';
import Image from 'next/image';

/**
 * Product Details Page Loading Component
 * Logo-based loader displayed during Suspense fallback / navigation
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white px-4">
      {/* Brand Logo Container with pulse animation */}
      <div className="relative w-44 sm:w-56 md:w-64 h-16 sm:h-20 md:h-24 animate-pulse mb-6">
        <Image
          src="/logo.png"
          alt="Stylish Fox Loading..."
          fill
          priority
          sizes="(max-width: 640px) 176px, (max-width: 768px) 224px, 256px"
          className="object-contain"
        />
      </div>

      {/* Elegant minimalist gold loading bar indicator */}
      <div className="w-32 sm:w-40 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
        <div className="h-full bg-[#fef08a] rounded-full animate-indeterminate duration-1000 w-1/2" />
      </div>
    </div>
  );
}
