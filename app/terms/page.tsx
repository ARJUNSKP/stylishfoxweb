import React from 'react';
import type { Metadata } from 'next';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Stylish Fox',
  description: 'Terms and Conditions for purchasing and using Stylish Fox apparel and digital services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#fef08a] selection:text-black">
      <TopBanner />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">
        <div className="border-b border-zinc-800 pb-6 space-y-2">
          <span className="text-[#fef08a] text-xs font-black uppercase tracking-widest">Legal</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-xs text-zinc-400">Last updated: October 2026</p>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">1. Acceptance of Terms</h2>
            <p className="text-zinc-400">
              By accessing Stylish Fox or purchasing via website, WhatsApp, or affiliated channels, you agree to comply with and be bound by these Terms and Conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">2. Product Specifications &amp; Pricing</h2>
            <p className="text-zinc-400">
              We strive to display garment colors, specifications, and details with maximum fidelity. All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise. Stylish Fox reserves the right to adjust pricing or product variants at any time without prior notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">3. Orders &amp; Direct WhatsApp Checkout</h2>
            <p className="text-zinc-400">
              Orders placed through our automated WhatsApp checkout link constitute binding order requests confirmed upon communication with our customer fulfillment team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">4. Intellectual Property</h2>
            <p className="text-zinc-400">
              All branding, logos, graphics, and apparel designs displayed on this website remain the sole intellectual property of Stylish Fox. Unauthorized reproduction or resale is strictly prohibited.
            </p>
          </section>
        </div>
      </main>

      <Footer />
      <FloatingIcons />
    </div>
  );
}
