import React from 'react';
import Image from 'next/image';
import { ShoppingBag, Heart } from 'lucide-react';

const baseProducts = [
  {
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    name: 'ESSENTIAL BLACK TEE',
    price: '₹ 1,299'
  },
  {
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    name: 'PREMIUM OVERSIZED BLACK T-SHIRT',
    price: '₹ 1,599'
  },
  {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600',
    isNew: false,
    name: 'VINTAGE WASH BLACK TEE',
    price: '₹ 1,399'
  },
  {
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=600',
    isNew: false,
    name: 'HEAVYWEIGHT BLACK SHIRT',
    price: '₹ 1,699'
  },
];

// Generate 40 products using the 4 base templates
const products = Array.from({ length: 40 }).map((_, i) => {
  const base = baseProducts[i % 4];
  return {
    ...base,
    id: i + 1,
    // Only make the first 8 items "New In"
    isNew: i < 8 ? base.isNew : false
  };
});

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 px-2 md:px-[2rem] py-4 bg-black">
      {products.map((product, index) => {
        // Make every 5th item featured (takes full width)
        const isFeatured = (index + 1) % 5 === 0;

        return (
          <div 
            key={`${product.id}-${index}`} 
            className={`flex flex-col group cursor-pointer ${isFeatured ? 'col-span-2 lg:col-span-1' : 'col-span-1'}`}
          >
            {/* Image Container */}
            <div className={`relative ${isFeatured ? 'aspect-[4/5] lg:aspect-[3/4]' : 'aspect-[3/4]'} overflow-hidden bg-gray-900 mb-3`}>
              {product.isNew && (
                <div className="absolute top-2 left-2 z-10 bg-[#fef08a] text-black text-xs font-bold px-2 py-1">
                  New In
                </div>
              )}
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {/* Decorative progress bar at bottom of image */}
              <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#fef08a]"></div>
            </div>
            
            {/* Details Container */}
            <div className="flex justify-between items-start w-full gap-2">
              <div className="flex flex-col flex-1">
                <h3 className="font-bold text-[13px] md:text-sm text-white uppercase leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="font-bold text-sm text-gray-300 mt-1">
                  {product.price}
                </p>
                
                {/* Color Swatches */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-4 h-4 border border-gray-600 bg-white"></div>
                  <div className="w-4 h-4 border border-gray-600 bg-black"></div>
                  <div className="w-4 h-4 border border-gray-600 bg-[#d2b48c]"></div>
                  <span className="text-xs text-gray-400 font-bold ml-1">+ 2</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 shrink-0">
                <button className="hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
