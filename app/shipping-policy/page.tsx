import React from 'react';
import type { Metadata } from 'next';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';
import { Truck, Clock, MapPin, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Policy | Stylish Fox',
  description: 'Shipping timelines, courier partners, free express thresholds, and tracking policies for Stylish Fox apparel.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#fef08a] selection:text-black">
      <TopBanner />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">
        <div className="border-b border-zinc-800 pb-6 space-y-2">
          <span className="text-[#fef08a] text-xs font-black uppercase tracking-widest">Support &amp; Fulfillment</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Shipping Policy</h1>
          <p className="text-xs text-zinc-400">Fast, insured pan-India delivery</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-2">
            <Truck className="w-5 h-5 text-[#fef08a]" />
            <h3 className="font-bold text-white text-xs uppercase">Free Express Shipping</h3>
            <p className="text-xs text-zinc-400">Available across India on all orders exceeding ₹1,999.</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-2">
            <Clock className="w-5 h-5 text-[#fef08a]" />
            <h3 className="font-bold text-white text-xs uppercase">Dispatch Timelines</h3>
            <p className="text-xs text-zinc-400">Orders are packed and dispatched from Kerala within 24 to 48 hours.</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-2">
            <MapPin className="w-5 h-5 text-[#fef08a]" />
            <h3 className="font-bold text-white text-xs uppercase">Delivery Timeframes</h3>
            <p className="text-xs text-zinc-400">South India: 2–3 business days. Rest of India: 4–6 business days.</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#fef08a]" />
            <h3 className="font-bold text-white text-xs uppercase">Live Tracking</h3>
            <p className="text-xs text-zinc-400">Real-time tracking links provided directly via SMS and WhatsApp.</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed pt-4 border-t border-zinc-800/80">
          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">Courier Partners</h2>
            <p className="text-zinc-400">
              We partner with Bluedart, Delhivery, DTDC, and India Post Speed Post to guarantee safe doorstep handover.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">Tamper-Proof Packaging</h2>
            <p className="text-zinc-400">
              Every garment is packed in sealed, weather-resistant security mailers. If your parcel arrives with torn seals, please report immediately to our WhatsApp support team before opening.
            </p>
          </section>
        </div>
      </main>

      <Footer />
      <FloatingIcons />
    </div>
  );
}
