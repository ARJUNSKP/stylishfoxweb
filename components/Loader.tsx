"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Loader() {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fading out after 2 seconds
    const timer = setTimeout(() => {
      setFading(true);
      // Remove completely after fade duration
      setTimeout(() => setLoading(false), 500);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative w-48 md:w-64 h-24 animate-pulse">
        <Image
          src="/logo.png"
          alt="Loading..."
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
