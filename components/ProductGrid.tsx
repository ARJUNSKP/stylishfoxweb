'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product, getAllProducts } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { fetchProducts } from '@/utils/api';

interface ProductGridProps {
  initialProducts?: Product[];
}

export default function ProductGrid({ initialProducts }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(() =>
    initialProducts && initialProducts.length > 0 ? initialProducts : getAllProducts()
  );
  const { addToCart } = useCart();

  useEffect(() => {
    // Refresh or fetch products from backend API
    fetchProducts().then((data) => {
      if (data && data.length > 0) {
        setProducts(data);
      }
    });
  }, []);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultColor =
      product.colors && product.colors.length > 0
        ? product.colors[0]
        : { name: 'Standard', hex: '#0d0d0d', images: product.images || [] };
    const defaultImage =
      defaultColor.images?.[0] ||
      product.images?.[0] ||
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
    const defaultSize = product.sizes?.[0] || 'M';

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: defaultImage,
      color: defaultColor.name,
      size: defaultSize,
      quantity: 1,
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 px-2 sm:px-4 md:px-8 py-4 sm:py-6 bg-black">
      {products.map((product, index) => {
        // Make every 5th item featured
        const isFeatured = (index + 1) % 5 === 0;
        const mainImage =
          product.colors?.[0]?.images?.[0] ||
          product.images?.[0] ||
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';

        const productHref = `/product/${product.id}`;

        return (
          <Link
            key={`${product.id}-${index}`}
            href={productHref}
            className={`flex flex-col group cursor-pointer ${
              isFeatured ? 'col-span-2 lg:col-span-1' : 'col-span-1'
            }`}
          >
            {/* Image Container */}
            <div
              className={`relative ${
                isFeatured ? 'aspect-[4/5] lg:aspect-[3/4]' : 'aspect-[3/4]'
              } overflow-hidden bg-zinc-900 mb-3`}
            >
              {product.isNew && (
                <div className="absolute top-2 left-2 z-10 bg-[#fef08a] text-black text-[11px] font-black uppercase tracking-wider px-2 py-0.5">
                  New In
                </div>
              )}
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover quick preview pill */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-zinc-700 shadow-xl">
                  <Eye className="w-3.5 h-3.5 text-[#fef08a]" /> View Details
                </span>
              </div>

              {/* Decorative progress bar at bottom of image */}
              <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#fef08a] group-hover:w-full transition-all duration-500"></div>
            </div>

            {/* Details Container */}
            <div className="flex justify-between items-start w-full gap-2">
              <div className="flex flex-col flex-1">
                <h3 className="font-bold text-[13px] md:text-sm text-white uppercase leading-tight line-clamp-2 group-hover:text-[#fef08a] transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-sm text-white">
                    ₹ {product.price ? product.price.toLocaleString() : '0'}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-zinc-500 line-through">
                      ₹ {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Color Swatches */}
                {product.colors && product.colors.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {product.colors.map((color, idx) => (
                      <div
                        key={idx}
                        title={color.name}
                        className="w-3.5 h-3.5 rounded-full border border-zinc-700"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                    <span className="text-[11px] text-zinc-400 font-semibold ml-1">
                      {product.colors.length} shades
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleQuickAdd(e, product)}
                  title="Quick add to bag"
                  className="p-2 hover:bg-zinc-800 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
