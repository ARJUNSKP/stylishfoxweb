'use client';

import React from 'react';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useProfile } from '@/context/ProfileContext';
import { createWhatsAppOrderUrl } from '@/utils/whatsapp';

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discount,
    shipping,
    grandTotal,
    totalCount,
  } = useCart();

  const { profile, addresses, selectedAddressId } = useProfile();

  if (!isCartOpen) return null;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const whatsappCartUrl = createWhatsAppOrderUrl({
    items: items.map((i) => ({
      name: i.name,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
    })),
    subtotal,
    discount,
    shipping,
    grandTotal,
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

  const freeShippingThreshold = 2000;
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-in panel - full width on mobile, max-w-md on tablet/desktop */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-zinc-950 border-l border-zinc-800 text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#fef08a]" />
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">Your Bag ({totalCount})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping banner */}
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-900/80 border-b border-zinc-800">
            <div className="text-xs font-semibold flex items-center justify-between mb-1.5">
              <span>
                {amountNeededForFreeShipping === 0 ? (
                  <span className="text-[#fef08a] flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> You unlocked FREE Express Shipping!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#fef08a]">₹{amountNeededForFreeShipping}</strong> more for free shipping
                  </span>
                )}
              </span>
              <span className="text-zinc-400 text-[11px]">{progressToFreeShipping}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#fef08a] transition-all duration-500 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-4 space-y-3 sm:space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
                  <ShoppingBag className="w-10 h-10 text-zinc-600" />
                </div>
                <p className="text-base font-bold text-white mb-1">Your bag is empty</p>
                <p className="text-xs text-zinc-400 max-w-xs mb-6">
                  Explore our premium heavy tee collection and select your favorite size and color.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#fef08a] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-yellow-300 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="relative w-20 h-24 bg-zinc-900 rounded overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold uppercase text-white line-clamp-1 leading-snug">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                        <span>Color: <strong className="text-zinc-200">{item.color}</strong></span>
                        <span>•</span>
                        <span>Size: <strong className="text-zinc-200">{item.size}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-zinc-700 rounded bg-zinc-900">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Auto calculated price */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">
                          ₹ {(item.price * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-zinc-500">
                            (₹{item.price} each)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary / Auto calculation footer */}
          {items.length > 0 && (
            <div className="border-t border-zinc-800 bg-black p-4 sm:p-6 space-y-2.5 sm:space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">₹ {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>10% Bulk Discount</span>
                    <span className="font-semibold">- ₹ {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span className="text-white font-semibold">
                    {shipping === 0 ? (
                      <span className="text-[#fef08a] font-bold">FREE</span>
                    ) : (
                      `₹ ${shipping}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                  <span>Total Amount</span>
                  <span className="text-[#fef08a] text-base">₹ {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <a
                href={whatsappCartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#25D366] hover:bg-[#1ebd59] text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-green-500/20 active:scale-[0.99] rounded text-center"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Checkout WhatsApp • ₹ {grandTotal.toLocaleString()}</span>
              </a>

              <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Direct WhatsApp Order • Instant Support & Dispatch</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
