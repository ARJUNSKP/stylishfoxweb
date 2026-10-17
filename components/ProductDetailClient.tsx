'use client';

import React, { useState } from 'react';
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
import { createWhatsAppOrderUrl } from '@/utils/whatsapp';

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const { addToCart } = useCart();
  const { profile, addresses, selectedAddressId } = useProfile();
  const allProducts = getAllProducts();

  const fallbackImages =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'];

  const fallbackColor = {
    name: 'Standard Edition',
    hex: '#0d0d0d',
    images: fallbackImages,
  };

  // State for selected color variation
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const activeColor =
    product.colors && product.colors.length > 0
      ? product.colors[selectedColorIndex] || product.colors[0]
      : fallbackColor;

  const activeImages =
    activeColor.images && activeColor.images.length > 0
      ? activeColor.images
      : fallbackImages;

  // State for active image index in current color's gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  // Handle color variation switch (also resets main preview image to first thumbnail of new color)
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setActiveImageIndex(0);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  // Auto calculate amount
  const itemTotalAmount = product.price * quantity;
  const originalTotalAmount = product.originalPrice * quantity;
  const savings = originalTotalAmount - itemTotalAmount;
  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: activeImages[activeImageIndex] || activeImages[0],
      color: activeColor.name,
      size: selectedSize,
      quantity,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
  const instantShipping = itemTotalAmount > 1999 ? 0 : 149;
  const instantFinalAmount = itemTotalAmount + instantShipping;

  const whatsappInstantUrl = createWhatsAppOrderUrl({
    items: [
      {
        name: product.name,
        color: activeColor.name,
        size: selectedSize,
        quantity,
        price: product.price,
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
  });

  const relatedProducts = allProducts
    .filter((p) => String(p.id) !== String(product.id))
    .slice(0, 4);

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

      {/* Main Grid: Left Side Images | Right Side Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
        {/* ================= LEFT SIDE: MULTIPLE T-SHIRT IMAGES ================= */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-3 sm:gap-4">
          {/* Vertical Thumbnails on tablet/desktop, horizontal touch-swipe on mobile */}
          <div className="flex md:flex-col gap-2.5 sm:gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24 shrink-0 pb-1 md:pb-0">
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
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 60px, 96px"
                    className="object-cover object-center"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#fef08a]/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Large Main Feature Image Display */}
          <div className="flex-1 relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] bg-zinc-950 rounded-lg sm:rounded-xl overflow-hidden border border-zinc-800/80 shadow-2xl group">
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
              alt={`${product.name} - ${activeColor.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />

            {/* Bottom Color & View Tag */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="bg-black/70 backdrop-blur-md text-[11px] font-semibold text-zinc-300 px-3 py-1 rounded border border-zinc-800">
                {activeColor.name} • View {activeImageIndex + 1} of {activeImages.length}
              </span>
              <span className="bg-emerald-950/80 backdrop-blur-md text-[11px] font-bold text-emerald-400 px-3 py-1 rounded border border-emerald-800/40">
                In Stock
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: DETAILS, COLOR, SIZE, QUANTITY, AUTO CALCULATE ================= */}
        <div className="lg:col-span-5 flex flex-col lg:sticky lg:top-24">
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
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
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pb-4 sm:pb-5 border-b border-zinc-800">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                ₹ {product.price.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base text-zinc-500 line-through">
                ₹ {product.originalPrice.toLocaleString()}
              </span>
              <span className="bg-[#fef08a]/10 border border-[#fef08a]/30 text-[#fef08a] text-[10px] sm:text-xs font-black uppercase px-2 sm:px-2.5 py-0.5 rounded">
                Save {discountPercent}%
              </span>
              <span className="text-[11px] sm:text-xs text-zinc-400 ml-auto font-medium">
                (Inclusive of all taxes)
              </span>
            </div>
          </div>

          {/* Color Variation Selector */}
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
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 sm:py-2.5 rounded text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#fef08a] text-black border-[#fef08a] shadow-lg shadow-yellow-500/10'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    {size}
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
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold">
                ✓ Ready for immediate dispatch
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:justify-start border border-zinc-700 bg-zinc-900 rounded-lg p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
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
                  disabled={quantity >= 10}
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

            <a
              href={whatsappInstantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-zinc-900 hover:bg-[#25D366] hover:text-black text-white font-black text-xs uppercase tracking-widest border border-zinc-700 hover:border-[#25D366] transition-all flex items-center justify-center gap-2 cursor-pointer rounded shadow-md group"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:text-black group-hover:fill-black transition-colors" />
              <span>Instant Buy WhatsApp</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 py-3 sm:py-4 border-t border-b border-zinc-800/80 text-center">
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2">
              <Truck className="w-4 sm:w-5 h-4 sm:h-5 text-[#fef08a]" />
              <span className="text-[10px] sm:text-[11px] font-bold text-white">Free Express</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400">Over ₹1,999</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2 border-x border-zinc-800/80">
              <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5 text-[#fef08a]" />
              <span className="text-[10px] sm:text-[11px] font-bold text-white">7 Days Easy</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400">Return & Exchange</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-1.5 sm:p-2">
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
          {relatedProducts.map((relProduct) => (
            <Link
              key={relProduct.id}
              href={`/product/${relProduct.id}`}
              className="group flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden mb-3">
                <Image
                  src={relProduct.colors[0].images[0]}
                  alt={relProduct.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-[#fef08a] group-hover:w-full transition-all duration-500" />
              </div>
              <h4 className="text-xs font-bold uppercase text-white line-clamp-1 group-hover:text-[#fef08a] transition-colors">
                {relProduct.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-white">
                  ₹ {relProduct.price.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 line-through">
                  ₹ {relProduct.originalPrice.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
