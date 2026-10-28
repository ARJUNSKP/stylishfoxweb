import React from 'react';
import type { Metadata } from 'next';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';

export const metadata: Metadata = {
  title: 'Privacy Policy | Stylish Fox',
  description: 'How Stylish Fox collects, protects, and handles personal data and customer information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#fef08a] selection:text-black">
      <TopBanner />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">
        <div className="border-b border-zinc-800 pb-6 space-y-2">
          <span className="text-[#fef08a] text-xs font-black uppercase tracking-widest">Customer Security</span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-zinc-400">Your privacy is fundamental to our trust</p>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">1. Information We Collect</h2>
            <p className="text-zinc-400">
              When creating an account, browsing products, or submitting a WhatsApp order, we may collect your name, phone number, delivery addresses, and order history strictly for processing and delivering your orders.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">2. How Information is Used</h2>
            <p className="text-zinc-400">
              Your details are exclusively used for order confirmations, courier shipping labels, invoices, and direct customer service queries. We do not sell, rent, or lease your personal information to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">3. Data Protection &amp; Security</h2>
            <p className="text-zinc-400">
              We employ enterprise encryption and secure HTTPS connections. Authentication tokens are securely encrypted and customer addresses are stored with restricted database access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold uppercase text-white tracking-wide">4. Contacting Us Regarding Your Data</h2>
            <p className="text-zinc-400">
              To request removal of your account or update stored address information, reach out directly to support@stylishfox.com or text our support line on WhatsApp.
            </p>
          </section>
        </div>
      </main>

      <Footer />
      <FloatingIcons />
    </div>
  );
}
