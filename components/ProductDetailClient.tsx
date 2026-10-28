'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  Check,
  MessageCircle,
} from 'lucide-react';
import { Product, getAllProducts } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useProfile } from '@/context/ProfileContext';
import { useSettings } from '@/context/SettingsContext';
import { createWhatsAppOrderUrl, createWhatsAppRebookUrl } from '@/utils/whatsapp';
import { fetchRelatedProducts, formatProductImageUrl } from '@/utils/api';

interface Props {
  product: Product;
  initialRelatedProducts?: Product[];
}

export default function ProductDetailClient({
  product,
  initialRelatedProducts,
}: Props) {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const {
    profile,
    addresses,
    selectedAddressId,
    requireWhatsAppPrerequisites,
  } = useProfile();
  const allProducts = getAllProducts();

  const [relatedProducts, setRelatedProducts] = useState<Product[]>(
    initialRelatedProducts && initialRelatedProducts.length > 0
      ? initialRelatedProducts
      : []
  );

  useEffect(() => {
    if (initialRelatedProducts && initialRelatedProducts.length > 0) {
      setRelatedProducts(initialRelatedProducts);
      return;
    }

    if (product?.id) {
      fetchRelatedProducts(product.id, 4).then((data) => {
        if (data && data.length > 0) {
          setRelatedProducts(data);
        } else {
          // Fallback only if backend returned empty
          const fallback = allProducts
            .filter((p) => String(p.id) !== String(product.id))
            .slice(0, 4);
          setRelatedProducts(fallback);
        }
      });
    }
  }, [product?.id, initialRelatedProducts]);

  const fallbackImages =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'];

  const hasColors = Boolean(product.colors && product.colors.length > 0);
  const fallbackColor = {
    name: '',
    hex: '',
    images: fallbackImages,
  };

  // State for selected color variation
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const activeColor = hasColors
    ? product.colors[selectedColorIndex] || product.colors[0]
    : fallbackColor;

  // State for size selection
  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : ['S', 'M', 'L', 'XL'];
  const [selectedSize, setSelectedSize] = useState<string>(
    availableSizes[1] || availableSizes[0] || 'M'
  );

  // State for quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Added to cart feedback state
  const [isAdded, setIsAdded] = useState(false);

  // Filter only published variants for storefront interaction
  const publishedVariants = useMemo(() => {
    if (!product.variants || !Array.isArray(product.variants)) return [];
    return product.variants.filter((v: any) => v.isPublished !== false);
  }, [product.variants]);

  // Find exact matching variant for selected color and size
  const currentVariant = useMemo(() => {
    if (publishedVariants.length === 0) return null;
    const curColor = (activeColor.name || '').toLowerCase().trim();
    const curSize = (selectedSize || '').toLowerCase().trim();

    // 1. Try exact match on both color and size
    const exact = publishedVariants.find((v: any) => {
      const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
      const vSize = (v.size?.code || v.size?.name || v.sizeCode || '').toLowerCase().trim();
      const colorMatches = !vColor || vColor === 'standard' || vColor === curColor;
      const sizeMatches = !vSize || vSize === 'free size' || vSize === curSize;
      return colorMatches && sizeMatches;
    });
    if (exact) return exact;

    // 2. Try match on color first
    const colorMatch = publishedVariants.find((v: any) => {
      const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
      return vColor && vColor === curColor;
    });
    if (colorMatch) return colorMatch;

    return publishedVariants[0] || null;
  }, [publishedVariants, activeColor.name, selectedSize]);

  // Gallery images: prefer variant-level images if available, else active color images, else fallback
  const activeImages: string[] = useMemo<string[]>(() => {
    let imgs: string[] = fallbackImages;
    if (currentVariant?.images && Array.isArray(currentVariant.images) && currentVariant.images.length > 0) {
      imgs = currentVariant.images as string[];
    } else if (activeColor.images && Array.isArray(activeColor.images) && activeColor.images.length > 0) {
      imgs = activeColor.images as string[];
    }
    return imgs.map((img) => formatProductImageUrl(img));
  }, [currentVariant?.images, activeColor.images, fallbackImages]);

  // State for active image index in current color's gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Handle color variation switch (also auto-syncs available size for the newly active color)
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setActiveImageIndex(0);

    const targetColor = product.colors[index];
    if (targetColor && publishedVariants.length > 0) {
      const colorVariants = publishedVariants.filter((v: any) => {
        const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
        return !vColor || vColor === 'standard' || vColor === targetColor.name.toLowerCase().trim();
      });

      if (colorVariants.length > 0) {
        const hasCurrentSize = colorVariants.some((v: any) => {
          const vSize = (v.size?.code || v.size?.name || v.sizeCode || '').toLowerCase().trim();
          return vSize === selectedSize.toLowerCase().trim();
        });

        if (!hasCurrentSize) {
          const firstSize = colorVariants[0].size?.code || colorVariants[0].size?.name || colorVariants[0].sizeCode;
          if (firstSize) {
            setSelectedSize(firstSize);
          }
        }
      }
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  // Determine if currently selected combination is out of stock
  const currentStock = useMemo(() => {
    if (currentVariant) {
      return typeof currentVariant.stock === 'number'
        ? currentVariant.stock
        : parseInt(currentVariant.stock, 10) || 0;
    }
    if (typeof product.stock === 'number') {
      return product.stock;
    }
    return 15;
  }, [currentVariant, product.stock]);

  const isOutOfStock = currentStock <= 0;

  // Check if a specific size is out of stock for the active color
  const isSizeOutOfStock = (sizeToCheck: string) => {
    if (publishedVariants.length === 0) {
      return product.stock !== undefined ? product.stock <= 0 : false;
    }
    const variantForSize = publishedVariants.find((v: any) => {
      const vColorName = (v.color?.name || v.colorName || '').toLowerCase().trim();
      const vSize = (v.size?.code || v.size?.name || v.sizeCode || '').toLowerCase().trim();
      const matchColor =
        !vColorName || vColorName === 'standard' || vColorName === activeColor.name.toLowerCase().trim();
      return matchColor && vSize === sizeToCheck.toLowerCase().trim();
    });
    if (!variantForSize) return true;
    const st =
      typeof variantForSize.stock === 'number'
        ? variantForSize.stock
        : parseInt(variantForSize.stock, 10) || 0;
    return st <= 0;
  };

  // Auto-switch to an in-stock size if currently selected size is out of stock
  useEffect(() => {
    if (publishedVariants.length === 0 || !product.sizes || product.sizes.length === 0) return;

    if (isSizeOutOfStock(selectedSize)) {
      const inStockSize = product.sizes.find((s) => !isSizeOutOfStock(s));
      if (inStockSize) {
        setSelectedSize(inStockSize);
      }
    }
  }, [activeColor.name, publishedVariants, product.sizes]);

  // Dynamic Pricing: Variant-based prices for the selected color & size
  const { activeUnitPrice, strikeUnitPrice, discountPercent, hasSellingPrice } = useMemo(() => {
    let regularPrice = product.price || 0;
    let salePrice: number | undefined = product.sellingPrice;

    if (currentVariant) {
      const vRegular = parseFloat(currentVariant.price);
      if (!isNaN(vRegular) && vRegular > 0) {
        regularPrice = vRegular;
      }

      const rawSelling = currentVariant.sellingPrice ?? currentVariant.selling_price;
      if (rawSelling !== undefined && rawSelling !== null) {
        const vSale = parseFloat(rawSelling);
        if (!isNaN(vSale) && vSale > 0) {
          salePrice = vSale;
        } else {
          salePrice = undefined;
        }
      }
    }

    const hasDiscount = Boolean(
      salePrice !== undefined &&
      salePrice !== null &&
      regularPrice > 0 &&
      salePrice < regularPrice
    );

    const unitPrice = hasDiscount ? salePrice! : regularPrice;
    const strikePrice = hasDiscount
      ? regularPrice
      : product.originalPrice && product.originalPrice > regularPrice
      ? product.originalPrice
      : undefined;

    const discountPct = hasDiscount
      ? Math.round(((regularPrice - salePrice!) / regularPrice) * 100)
      : strikePrice && strikePrice > unitPrice
      ? Math.round(((strikePrice - unitPrice) / strikePrice) * 100)
      : 0;

    return {
      activeUnitPrice: unitPrice,
      strikeUnitPrice: strikePrice,
      discountPercent: discountPct,
      hasSellingPrice: hasDiscount,
    };
  }, [currentVariant, product.price, product.sellingPrice, product.originalPrice]);

  const itemTotalAmount = activeUnitPrice * quantity;
  const originalTotalAmount = (strikeUnitPrice || activeUnitPrice) * quantity;
  const savings = Math.max(0, originalTotalAmount - itemTotalAmount);

  const handleRebookWhatsApp = () => {
    if (!requireWhatsAppPrerequisites({ actionDescription: 'send an out-of-stock rebook enquiry via WhatsApp' })) {
      return;
    }
    const url = createWhatsAppRebookUrl({
      productName: product.name,
      color: activeColor.name,
      size: selectedSize,
      price: activeUnitPrice,
      productId: product.id,
      customer: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactNumber: profile.contactNumber,
        whatsappNumber: profile.whatsappNumber || profile.contactNumber,
        email: profile.email,
      },
      whatsappNumber: settings?.whatsappNumber,
    });

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: activeUnitPrice,
      image: activeImages[activeImageIndex] || activeImages[0],
      color: activeColor.name,
      size: selectedSize,
      quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleInstantWhatsAppBuy = () => {
    if (!requireWhatsAppPrerequisites({ actionDescription: 'purchase directly on WhatsApp' })) {
      return;
    }
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
    const freeShippingThreshold = Number(settings?.freeShippingThreshold) || 2000;
    const shippingFee = Number(settings?.shippingFee) || 149;
    const instantShipping = itemTotalAmount >= freeShippingThreshold ? 0 : shippingFee;
    const instantFinalAmount = itemTotalAmount + instantShipping;

    const url = createWhatsAppOrderUrl({
      items: [
        {
          name: product.name,
          color: activeColor.name,
          size: selectedSize,
          quantity,
          price: activeUnitPrice,
        },
      ],
      subtotal: itemTotalAmount,
      discount: 0,
      shipping: instantShipping,
      grandTotal: instantFinalAmount,
      customer: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        contactNumber: profile.contactNumber,
        whatsappNumber: profile.whatsappNumber || profile.contactNumber,
        email: profile.email,
      },
      address: selectedAddress
        ? {
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            tag: selectedAddress.tag,
          }
        : undefined,
      whatsappNumber: settings?.whatsappNumber,
    });

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-10">
      {/* Breadcrumb Navigation - scrollable on mobile */}
      <nav className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 mb-4 sm:mb-6 uppercase tracking-wider overflow-x-auto no-scrollbar whitespace-nowrap py-1">
        <Link href="/" className="hover:text-white transition-colors shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <Link href="/" className="hover:text-white transition-colors shrink-0">
          Collection
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <span className="text-zinc-200 font-bold truncate max-w-[160px] sm:max-w-xs md:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Grid: Left Side Images (Sticky) | Right Side Details (Scrolling) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start relative">
        {/* ================= LEFT SIDE: MULTIPLE T-SHIRT IMAGES (STICKY) ================= */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 self-start flex flex-col-reverse md:flex-row gap-3 sm:gap-4">
          {/* Vertical Thumbnails on tablet/desktop, horizontal touch-swipe on mobile */}
          <div className="flex md:flex-col gap-2.5 sm:gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24 shrink-0 pb-1 md:pb-0 max-h-[75vh]">
            {activeImages.map((imgUrl, idx) => {
              const isSelected = idx === activeImageIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 sm:w-16 md:w-full aspect-[3/4] rounded-md overflow-hidden bg-zinc-900 border-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-[#fef08a] scale-[1.02] shadow-md shadow-yellow-500/10'
                      : 'border-zinc-800 opacity-70 hover:opacity-100 hover:border-zinc-600'
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <Image
                    src={imgUrl}
                    alt={product?.name ? `${product.name} view ${idx + 1}` : `Product view ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 60px, 96px"
                    className="object-cover object-center"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#fef08a]/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Large Main Feature Image Display */}
          <div className="flex-1 relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] lg:max-h-[calc(100vh-8rem)] bg-zinc-950 rounded-lg sm:rounded-xl overflow-hidden border border-zinc-800/80 shadow-2xl group">
            {product.isNew && (
              <div className="absolute top-4 left-4 z-20 bg-[#fef08a] text-black text-xs font-black uppercase tracking-wider px-3 py-1 shadow-md">
                New In
              </div>
            )}

            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({
                      title: product.name,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700 text-white hover:bg-black/80 transition-all cursor-pointer"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <Image
              src={activeImages[activeImageIndex] || activeImages[0]}
              alt={product?.name ? `${product.name} - ${activeColor?.name || 'Standard'}` : 'Product image'}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Bottom Color & View Tag */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="bg-black/70 backdrop-blur-md text-[11px] font-semibold text-zinc-300 px-3 py-1 rounded border border-zinc-800">
                {activeColor.name} • View {activeImageIndex + 1} of {activeImages.length}
              </span>
              {isOutOfStock ? (
               ""
              ) : (
                <span className="bg-emerald-950/80 backdrop-blur-md text-[11px] font-bold text-emerald-400 px-3 py-1 rounded border border-emerald-800/40">
                  In Stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: DETAILS, COLOR, SIZE, QUANTITY, AUTO CALCULATE (SCROLLING) ================= */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
              <span className="text-[11px] sm:text-xs uppercase font-extrabold text-[#fef08a] tracking-widest">
                Stylish Fox Signature
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight mb-1 sm:mb-2">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mb-3 sm:mb-4">
              {product.tagline}
            </p>

            {/* Pricing Section */}
            <div className="pb-4 sm:pb-5 border-b border-zinc-800">
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white transition-all duration-200">
                  ₹ {activeUnitPrice.toLocaleString()}
                </span>
                {strikeUnitPrice && strikeUnitPrice > activeUnitPrice && (
                  <span className="text-sm sm:text-base text-zinc-500 line-through transition-all duration-200">
                    ₹ {strikeUnitPrice.toLocaleString()}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#fef08a]/10 border border-[#fef08a]/30 text-[#fef08a] text-[10px] sm:text-xs font-black uppercase px-2 sm:px-2.5 py-0.5 rounded transition-all duration-200">
                    {discountPercent}% OFF
                  </span>
                )}
                <span className="text-[11px] sm:text-xs text-zinc-400 ml-auto font-medium">
                  (Inclusive of all taxes)
                </span>
              </div>

              {/* Dynamic Variant Spec & SKU Indicator */}
              {currentVariant && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-zinc-400">
                    {hasColors && activeColor.name ? (
                      <>
                        Selected: <strong className="text-white">{activeColor.name}</strong> • Size{' '}
                        <strong className="text-white">{selectedSize}</strong>
                      </>
                    ) : (
                      <>
                        Selected Size: <strong className="text-white">{selectedSize}</strong>
                      </>
                    )}
                  </span>
                  {currentVariant.sku && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      SKU: {currentVariant.sku}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Color Variation Selector (hidden if product has no colors) */}
          {hasColors && product.colors.length > 0 && (
            <div className="py-4 sm:py-5 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <span className="text-[11px] sm:text-xs uppercase font-bold text-zinc-400 tracking-wider">
                  Select Color: <strong className="text-white ml-1">{activeColor.name}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {product.colors.map((color, index) => {
                  const isSelected = index === selectedColorIndex;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorChange(index)}
                      className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#fef08a] bg-zinc-900 shadow-md ring-1 ring-[#fef08a]'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full border border-zinc-600 shadow-inner shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-[11px] sm:text-xs font-bold text-zinc-200 group-hover:text-white">
                        {color.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#fef08a] ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div className="py-4 sm:py-5 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Select Size: <strong className="text-white ml-1">{selectedSize}</strong>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {product.sizes.map((size) => {
                const isSelected = size === selectedSize;
                const sizeOutOfStock = isSizeOutOfStock(size);

                // Find variant for this size under active color to show size-specific price
                const sizeVariant = publishedVariants.find((v: any) => {
                  const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
                  const vSize = (v.size?.code || v.size?.name || v.sizeCode || '').toLowerCase().trim();
                  const curColor = (activeColor.name || '').toLowerCase().trim();
                  const matchColor = !vColor || vColor === 'standard' || vColor === curColor;
                  return matchColor && vSize === size.toLowerCase().trim();
                });

                const rawSelling = sizeVariant?.sellingPrice ?? sizeVariant?.selling_price;
                const sizeSelling =
                  rawSelling !== undefined && rawSelling !== null && !isNaN(parseFloat(rawSelling))
                    ? parseFloat(rawSelling)
                    : undefined;
                const sizeRegular =
                  sizeVariant?.price !== undefined && !isNaN(parseFloat(sizeVariant.price))
                    ? parseFloat(sizeVariant.price)
                    : undefined;
                const sizeEffectivePrice =
                  sizeSelling && sizeRegular && sizeSelling < sizeRegular
                    ? sizeSelling
                    : sizeSelling || sizeRegular;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={sizeOutOfStock}
                    onClick={() => {
                      if (!sizeOutOfStock) {
                        setSelectedSize(size);
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center relative overflow-hidden select-none ${
                      sizeOutOfStock
                        ? 'opacity-40 cursor-not-allowed bg-zinc-950/90 text-zinc-600 border-zinc-800/60 pointer-events-none'
                        : isSelected
                        ? 'bg-[#fef08a] text-black border-[#fef08a] shadow-lg shadow-yellow-500/10 cursor-pointer'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white cursor-pointer'
                    }`}
                  >
                    <span className={sizeOutOfStock ? 'line-through text-zinc-500' : ''}>{size}</span>
                    {sizeOutOfStock ? (
                      <span className="text-[7.5px] font-bold text-red-500/80 mt-0.5 tracking-tight leading-none uppercase">
                        Sold Out
                      </span>
                    ) : sizeEffectivePrice && sizeEffectivePrice > 0 ? (
                      <span
                        className={`text-[8px] font-mono mt-0.5 leading-none ${
                          isSelected ? 'text-black/80 font-bold' : 'text-zinc-400'
                        }`}
                      >
                        ₹{sizeEffectivePrice.toLocaleString()}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Auto Calculate Amount */}
          <div className="py-4 sm:py-5 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Quantity
              </span>
              {isOutOfStock ? (
                ""
              ) : (
                <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold">
                  ✓ Ready for immediate dispatch
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:justify-start border border-zinc-700 bg-zinc-900 rounded-lg p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-sm text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10 || isOutOfStock}
                  className="w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dynamic Auto Calculated Total Box */}
              <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3.5 sm:px-4 py-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">
                    Calculated Total ({quantity} {quantity > 1 ? 'items' : 'item'})
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base sm:text-lg font-black text-[#fef08a]">
                      ₹ {itemTotalAmount.toLocaleString()}
                    </span>
                    {quantity > 1 && (
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 line-through">
                        ₹ {originalTotalAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {savings > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 sm:py-1 rounded border border-emerald-800/40">
                    Saved ₹{savings.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="py-6 space-y-3">
            {isOutOfStock ? (
              <>
                {/* Out of Stock Notice Box */}
                <div className="p-3.5 bg-red-950/30 border border-red-800/50 rounded-lg text-left space-y-1">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Currently Out of Stock ({activeColor.name} • Size {selectedSize})
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    This variant is temporarily sold out in our warehouse. Send a WhatsApp Rebook Enquiry to reserve your piece from our upcoming restock batch!
                  </p>
                </div>

                {/* Primary WhatsApp Rebook CTA */}
                <button
                  type="button"
                  onClick={handleRebookWhatsApp}
                  className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs md:text-sm uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-[#25D366]/20 active:scale-[0.99] cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-black" />
                  <span>Send Rebook Enquiry on WhatsApp</span>
                </button>

                {/* Disabled Add To Cart */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-xs uppercase tracking-widest rounded flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Sold Out • Add To Bag Disabled</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-4 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                    isAdded
                      ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                      : 'bg-[#fef08a] text-black hover:bg-yellow-300 shadow-yellow-500/10 active:scale-[0.99]'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added To Cart! (₹ {itemTotalAmount.toLocaleString()})</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        Add To Cart • ₹ {itemTotalAmount.toLocaleString()}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleInstantWhatsAppBuy}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-[#25D366] hover:text-black text-white font-black text-xs uppercase tracking-widest border border-zinc-700 hover:border-[#25D366] transition-all flex items-center justify-center gap-2 cursor-pointer rounded shadow-md group"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-black group-hover:fill-black transition-colors" />
                  <span>Instant Buy WhatsApp</span>
                </button>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 py-3 sm:py-4 border-t border-b border-zinc-800/80 text-center">
            <div className="flex flex-col items-center justify-center gap-1 p-1.5 sm:p-2 border-r border-zinc-800/80">
              <Truck className="w-4 sm:w-5 h-4 sm:h-5 text-[#fef08a]" />
              <span className="text-[10px] sm:text-[11px] font-bold text-white">Free Express</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400">Over ₹1,999</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 p-1.5 sm:p-2">
              <ShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-[#fef08a]" />
              <span className="text-[10px] sm:text-[11px] font-bold text-white">100% Genuine</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400">Combed Cotton</span>
            </div>
          </div>

          {/* Description & Product Specification */}
          <div className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
            <div>
              <h3 className="text-[11px] sm:text-xs uppercase font-extrabold text-zinc-300 tracking-wider mb-1.5 sm:mb-2">
                About The Product
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-[11px] sm:text-xs uppercase font-extrabold text-zinc-300 tracking-wider mb-1.5 sm:mb-2">
                Key Features
              </h3>
              <ul className="space-y-1.5">
                {product.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-zinc-400 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fef08a] shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fabric & Care Specs */}
            <div className="pt-2 border-t border-zinc-800/80">
              <h3 className="text-[11px] sm:text-xs uppercase font-extrabold text-zinc-300 tracking-wider mb-1.5 sm:mb-2">
                Fabric & Care
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                100% Super-combed heavyweight organic cotton (240 GSM). Bio-washed for ultimate softness and zero shrinkage. Machine wash cold inside-out with like colors. Do not iron directly on prints.
              </p>
            </div>

            {/* Shipping & Delivery Info */}
            <div className="pt-2 border-t border-zinc-800/80">
              <h3 className="text-[11px] sm:text-xs uppercase font-extrabold text-zinc-300 tracking-wider mb-1.5 sm:mb-2">
                Shipping & Returns
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dispatched within 24 hours. Free express shipping across India on orders above ₹{(Number(settings?.freeShippingThreshold) || 2000).toLocaleString()}. Easy 7-day doorstep size replacement and exchanges available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended / Related Products Section */}
      <div className="mt-12 sm:mt-16 md:mt-24 pt-8 sm:pt-10 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-black uppercase text-white tracking-wider">
              You May Also Like
            </h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
              Curated minimal heavyweight silhouettes
            </p>
          </div>
          <Link
            href="/"
            className="text-[11px] sm:text-xs text-[#fef08a] font-bold uppercase hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {relatedProducts.map((relProduct, idx) => {
            const variantImage =
              Array.isArray(relProduct.variants) && relProduct.variants[0]?.images?.[0]
                ? relProduct.variants[0].images[0]
                : null;
            const relImage = formatProductImageUrl(
              relProduct.colors?.[0]?.images?.[0] ||
              relProduct.images?.[0] ||
              variantImage ||
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
            );

            return (
              <Link
                key={`${relProduct.id}-${idx}`}
                href={`/product/${relProduct.id}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden mb-3">
                  <Image
                    src={relImage}
                    alt={relProduct?.name || 'Related product'}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#fef08a] group-hover:w-full transition-all duration-500" />
                </div>
                <h4 className="text-xs font-bold uppercase text-white line-clamp-1 group-hover:text-[#fef08a] transition-colors">
                  {relProduct.name}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {relProduct.sellingPrice &&
                  relProduct.price &&
                  relProduct.sellingPrice < relProduct.price ? (
                    <>
                      <span className="text-xs font-bold text-white">
                        ₹ {relProduct.sellingPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-zinc-500 line-through">
                        ₹ {relProduct.price ? relProduct.price.toLocaleString() : '0'}
                      </span>
                      <span className="text-[9px] font-black text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-1 py-0.2 rounded">
                        {Math.round(
                          ((relProduct.price - relProduct.sellingPrice) / relProduct.price) * 100
                        )}% OFF
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-white">
                        ₹ {relProduct.price ? relProduct.price.toLocaleString() : '0'}
                      </span>
                      {relProduct.originalPrice ? (
                        <span className="text-[11px] text-zinc-500 line-through">
                          ₹ {relProduct.originalPrice.toLocaleString()}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
