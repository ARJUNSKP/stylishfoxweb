'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, MessageCircle } from 'lucide-react';
import { Product, getAllProducts } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useProfile } from '@/context/ProfileContext';
import { fetchProducts, formatProductImageUrl } from '@/utils/api';
import { createWhatsAppRebookUrl } from '@/utils/whatsapp';

interface ProductGridProps {
  initialProducts?: Product[];
  products?: Product[];
}

export default function ProductGrid({ initialProducts, products: controlledProducts }: ProductGridProps) {
  const [localProducts, setLocalProducts] = useState<Product[]>(() =>
    initialProducts && initialProducts.length > 0 ? initialProducts : getAllProducts()
  );
  const { addToCart } = useCart();
  const { profile, requireWhatsAppPrerequisites } = useProfile();

  useEffect(() => {
    if (controlledProducts !== undefined) return;
    if (initialProducts && initialProducts.length > 0) return;
    // Refresh or fetch products from backend API when uncontrolled
    fetchProducts().then((data) => {
      if (data && data.length > 0) {
        setLocalProducts(data);
      }
    });
  }, [controlledProducts, initialProducts]);

  const products = controlledProducts !== undefined ? controlledProducts : localProducts;

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

  const handleQuickRebook = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireWhatsAppPrerequisites({ actionDescription: 'send an out-of-stock rebook enquiry via WhatsApp' })) {
      return;
    }
    const defaultColor = product.colors?.[0]?.name || 'Standard';
    const defaultSize = product.sizes?.[0] || 'M';
    const url = createWhatsAppRebookUrl({
      productName: product.name,
      color: defaultColor,
      size: defaultSize,
      price: product.price,
      productId: product.id,
      customer: {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        contactNumber: profile?.contactNumber,
        whatsappNumber: profile?.whatsappNumber || profile?.contactNumber,
        email: profile?.email,
      },
    });

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 px-2 sm:px-4 md:px-8 py-4 sm:py-6 bg-black">
      {products.map((product, index) => {
        // Make every 5th item featured
        const isFeatured = (index + 1) % 5 === 0;
        const mainImage = formatProductImageUrl(
          product.colors?.[0]?.images?.[0] ||
          product.images?.[0] ||
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
        );

        const productHref = `/product/${product.id}`;
        const isOutOfStock = product.stock !== undefined && product.stock <= 0;
        const hasDiscount = Boolean(
          product.sellingPrice &&
          product.price &&
          product.sellingPrice < product.price
        );
        const discountPercent = hasDiscount
          ? Math.round(((product.price - product.sellingPrice!) / product.price) * 100)
          : 0;

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
              {isOutOfStock ? (
                <div className="absolute top-2 left-2 z-10 bg-red-600/95 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Out of Stock
                </div>
              ) : hasDiscount ? (
                <div className="absolute top-2 left-2 z-10 bg-[#fef08a] text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  {discountPercent}% OFF
                </div>
              ) : product.isNew ? (
                <div className="absolute top-2 left-2 z-10 bg-[#fef08a] text-black text-[11px] font-black uppercase tracking-wider px-2 py-0.5">
                  New In
                </div>
              ) : null}

              <Image
                src={mainImage}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
                  isOutOfStock ? 'opacity-75 grayscale-[20%]' : ''
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Hover quick preview pill */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-zinc-700 shadow-xl">
                  {isOutOfStock ? (
                    <>
                      <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> Out of Stock • Rebook
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-[#fef08a]" /> View Details
                    </>
                  )}
                </span>
              </div>

              {/* Decorative progress bar at bottom of image */}
              <div
                className={`absolute bottom-0 left-0 h-1 w-1/3 transition-all duration-500 ${
                  isOutOfStock
                    ? 'bg-red-500 group-hover:w-full'
                    : 'bg-[#fef08a] group-hover:w-full'
                }`}
              />
            </div>

            {/* Details Container */}
            <div className="flex justify-between items-start w-full gap-2">
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[13px] md:text-sm text-white uppercase leading-tight line-clamp-2 group-hover:text-[#fef08a] transition-colors">
                    {product.name}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {hasDiscount ? (
                    <>
                      <span className="font-bold text-sm text-white">
                        ₹ {product.sellingPrice!.toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-500 line-through">
                        ₹ {product.price ? product.price.toLocaleString() : '0'}
                      </span>
                      <span className="text-[10px] font-black text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-1.5 py-0.2 rounded tracking-tight">
                        {discountPercent}% OFF
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-sm text-white">
                        ₹ {product.price ? product.price.toLocaleString() : '0'}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-zinc-500 line-through">
                          ₹ {product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                  {isOutOfStock && (
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      • Sold Out
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
                {isOutOfStock ? (
                  <button
                    type="button"
                    onClick={(e) => handleQuickRebook(e, product)}
                    title="Out of stock - Rebook on WhatsApp"
                    className="p-2 hover:bg-[#25D366]/20 text-[#25D366] rounded-full transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, product)}
                    title="Quick add to bag"
                    className="p-2 hover:bg-zinc-800 hover:text-white rounded-full transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
