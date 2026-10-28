import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';
import { ShieldCheck, Sparkles, Flame, ArrowRight, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Stylish Fox',
  description: 'Learn about Stylish Fox, our story, craftsmanship, philosophy, and dedication to modern premium streetwear.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#fef08a] selection:text-black">
      <TopBanner />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black -z-10" />
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="inline-block text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              Our Identity
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-tight">
              Redefining <span className="text-[#fef08a]">Modern Streetwear</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Stylish Fox was born with a single obsession: creating structural, heavyweight, minimalist silhouettes designed for uncompromising comfort and clean aesthetic expression.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
              Crafted in Kerala. <br /><span className="text-[#fef08a]">Built for Everywhere.</span>
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Rooted in Mattakkara, Kottayam, Stylish Fox creates wardrobe staples with an architectural edge. Every piece undergoes rigorous fit trials, high-GSM combed cotton sourcing, and precision stitch tests.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We reject fast fashion culture. Instead, we craft limited, timeless drops made to endure daily wear while holding their silhouette wash after wash.
            </p>
            <div className="pt-2">
              <Link
                href="/our-team"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-black text-black bg-[#fef08a] hover:bg-white px-5 py-3 rounded transition-all"
              >
                <span>Meet Our Team</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-xl space-y-3">
              <Flame className="w-6 h-6 text-[#fef08a]" />
              <h3 className="font-bold text-white text-sm uppercase">Heavyweight GSM</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Premium 220–280 GSM combed cotton engineered for structural drape.
              </p>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-xl space-y-3">
              <ShieldCheck className="w-6 h-6 text-[#fef08a]" />
              <h3 className="font-bold text-white text-sm uppercase">Zero Compromise</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reinforced stitching, ribbed collars, and pre-shrunk fabrication.
              </p>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-xl space-y-3">
              <Sparkles className="w-6 h-6 text-[#fef08a]" />
              <h3 className="font-bold text-white text-sm uppercase">Curated Drops</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Small-batch runs focused on quality control and distinctive colors.
              </p>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-xl space-y-3">
              <HeartHandshake className="w-6 h-6 text-[#fef08a]" />
              <h3 className="font-bold text-white text-sm uppercase">Direct to Community</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Transparent pricing, direct WhatsApp customer care, and quick dispatch.
              </p>
            </div>
          </div>
        </section>

        {/* Commitment Banner */}
        <section className="bg-zinc-950 border-t border-b border-zinc-800/80 py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wider">
              Experience The Standard
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
              Explore our latest drop and discover why our community chooses Stylish Fox for everyday confidence.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-block bg-[#fef08a] hover:bg-white text-black font-black uppercase text-xs tracking-widest px-6 py-3.5 rounded transition-all"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingIcons />
    </div>
  );
}
