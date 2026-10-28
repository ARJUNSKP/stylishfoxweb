import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';
import { Users, Sparkles, Award, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Team | Stylish Fox',
  description: 'Meet the passionate team behind Stylish Fox design, textile curation, and customer experience.',
};

const teamMembers = [
  {
    name: 'Arjun Sivadas',
    role: 'Founder & Creative Lead',
    bio: 'Directing design language, structural pattern-making, and brand vision from day one.',
    initials: 'AS',
  },
  {
    name: 'Design & Textile Atelier',
    role: 'Product Development & Fabric Curation',
    bio: 'Sourcing 240+ GSM combed yarns, supervising bio-wash processes, and refining silhouette drapes.',
    initials: 'DA',
  },
  {
    name: 'Customer Experience Team',
    role: 'Support & Order Dispatch',
    bio: 'Ensuring seamless WhatsApp ordering, express doorstep delivery, and dedicated customer care.',
    initials: 'CX',
  },
];

export default function OurTeamPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#fef08a] selection:text-black">
      <TopBanner />
      <Header />

      <main className="flex-1">
        {/* Header Banner */}
        <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-zinc-800 overflow-hidden text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-800/30 via-black to-black -z-10" />
          <div className="max-w-3xl mx-auto space-y-5">
            <span className="inline-block text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              The Creators
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
              Meet The <span className="text-[#fef08a]">Team</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
              The creative minds, fabric obsessives, and operational team dedicated to making everyday apparel exceptional.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-[#fef08a]/50 transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-xl bg-black border border-zinc-700 flex items-center justify-center text-lg font-black text-[#fef08a] group-hover:scale-105 transition-transform">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#fef08a] font-semibold tracking-wider uppercase mt-1">
                      {member.role}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {member.bio}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-800/70 mt-6 flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-[#fef08a]" />
                  <span>Stylish Fox Craft</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values & Culture */}
        <section className="bg-zinc-950 border-t border-zinc-800 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide">
              Our Working Culture
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-lg space-y-2">
                <Users className="w-5 h-5 text-[#fef08a]" />
                <h4 className="font-bold text-white text-xs uppercase">Community First</h4>
                <p className="text-xs text-zinc-400">
                  Every feedback loop from our customers directly shapes our next collection cut and color palette.
                </p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-lg space-y-2">
                <Award className="w-5 h-5 text-[#fef08a]" />
                <h4 className="font-bold text-white text-xs uppercase">Precision Sourcing</h4>
                <p className="text-xs text-zinc-400">
                  We don&apos;t settle for standard market blanks. Everything is custom knitted and pre-shrunk.
                </p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-lg space-y-2">
                <Sparkles className="w-5 h-5 text-[#fef08a]" />
                <h4 className="font-bold text-white text-xs uppercase">Continuous Iteration</h4>
                <p className="text-xs text-zinc-400">
                  Constantly innovating on neckline durability, seam longevity, and drape aesthetics.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/about-us"
                className="text-xs uppercase tracking-widest font-black text-[#fef08a] hover:underline flex items-center gap-1.5"
              >
                <span>Read our story</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
