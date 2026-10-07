import React from 'react';
import { User, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-8 border-b border-gray-800 bg-black sticky top-0 z-50 text-white">
      {/* Left side: Profile */}
      <div className="flex items-center w-1/3">
        <button className="p-2 hover:bg-gray-800 rounded-md transition-colors">
          <User className="w-6 h-6 text-white" />
        </button>
      </div>
      
      {/* Center: Logo */}
      <div className="flex items-center justify-center w-1/3">
        <div className="relative h-12 w-32 md:w-40">
          <Image 
            src="/logo.png" 
            alt="Stylish Fox" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      {/* Right side: Cart */}
      <div className="flex items-center justify-end w-1/3">
        <button className="text-white hover:text-gray-300 relative p-2 transition-colors">
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute top-0 right-0 bg-[#fef08a] text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
        </button>
      </div>
    </header>
  );
}
