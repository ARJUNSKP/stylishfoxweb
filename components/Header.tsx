'use client';

import React, { useSyncExternalStore } from 'react';
import { User, ShoppingBag, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useProfile } from '@/context/ProfileContext';

const emptySubscribe = () => () => {};

export default function Header() {
  const { totalCount, setIsCartOpen } = useCart();
  const { openProfileOrAuth, profile, isAuthenticated, user, isAdmin } = useProfile();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const showAdmin = isMounted && (isAdmin || user?.role?.toLowerCase() === 'admin');

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 md:px-8 py-2.5 sm:py-4 border-b border-gray-800 bg-black sticky top-0 z-50 text-white">
      {/* Left side: Profile */}
      <div className="flex items-center w-1/3">
        <button
          onClick={openProfileOrAuth}
          className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-2 group cursor-pointer"
          aria-label={isMounted && isAuthenticated ? "User Account" : "Sign In / Register"}
        >
          <div className="relative">
            <User
              className={`w-5 sm:w-6 h-5 sm:h-6 transition-colors ${
                isMounted && isAuthenticated
                  ? 'text-[#fef08a]'
                  : 'text-white group-hover:text-[#fef08a]'
              }`}
            />
          </div>
          {isMounted && isAuthenticated && profile.firstName ? (
            <span className="hidden sm:inline-block text-xs font-bold uppercase text-zinc-300 group-hover:text-white transition-colors">
              {profile.firstName}
            </span>
          ) : isMounted && !isAuthenticated ? (
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#fef08a] transition-colors">
              Sign In
            </span>
          ) : null}
        </button>
      </div>
      
      {/* Center: Logo */}
      <div className="flex items-center justify-center w-1/3">
        <Link href="/" className="relative h-9 sm:h-12 w-28 sm:w-36 md:w-40 block">
          <Image 
            src="/logo.png" 
            alt="Stylish Fox" 
            fill
            sizes="(max-width: 640px) 112px, 160px"
            className="object-contain"
            priority
          />
        </Link>
      </div>
      
      {/* Right side: Admin Dashboard & Cart */}
      <div className="flex items-center justify-end w-1/3 gap-1.5 sm:gap-3">
        {showAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/30 hover:to-yellow-500/25 text-[#fef08a] border border-[#fef08a]/40 hover:border-[#fef08a] rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-yellow-500/10 hover:scale-105 active:scale-95 group cursor-pointer"
            title="Admin Dashboard"
            aria-label="Admin Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fef08a] group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Admin Dashboard</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        )}

        <button 
          onClick={() => setIsCartOpen(true)}
          className="text-white hover:text-gray-300 relative p-2 transition-colors cursor-pointer"
          aria-label="Open Shopping Bag"
        >
          <ShoppingBag className="w-6 h-6" />
          {isMounted && totalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#fef08a] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {totalCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
