import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-gray-800 text-gray-400 py-12 md:py-16 px-2 md:px-[2rem]">
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
        
        {/* Brand & Address */}
        <div className="space-y-6">
          <div className="relative w-40 h-16">
            <Image 
              src="/logo.png" 
              alt="Stylish Fox Logo" 
              fill 
              className="object-contain object-left" 
            />
          </div>
          <div className="text-sm space-y-1">
            <p className="text-gray-300 leading-tight">
              <strong>Address:</strong><br />
              Stylish Fox<br />
              Mattakkara, Kottayam<br />
              Kerala 686564, India
            </p>
            <p className="text-gray-300 pt-1"><strong>Email:</strong> support@stylishfox.com</p>
            <p className="text-gray-300"><strong>Phone:</strong> +1 (800) 123-4567</p>
          </div>
        </div>

        {/* Links & Support (Side-by-side on mobile) */}
        <div className="grid grid-cols-2 gap-4 md:contents">
          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-bold tracking-wider">QUICK LINKS</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="hover:text-[#fef08a] transition-colors">Home</Link></li>
              <li><Link href="#" className="hover:text-[#fef08a] transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-[#fef08a] transition-colors">Our Team</Link></li>
            </ul>
          </div>

          {/* Support & Policies */}
          <div className="space-y-4 text-right md:text-left">
            <h4 className="text-white font-bold tracking-wider">SUPPORT</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-[#fef08a] transition-colors">Terms & Conditions</Link></li>
              <li><Link href="#" className="hover:text-[#fef08a] transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="hover:text-[#fef08a] transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="text-white font-bold tracking-wider">NEWSLETTER</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-[#111] border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#fef08a] transition-colors w-full"
            />
            <button className="bg-[#fef08a] text-black font-bold py-3 px-4 text-sm hover:bg-white transition-colors w-full tracking-wider">
              SUBSCRIBE
            </button>
          </div>
        </div>

      </div>
      
      <div className="w-full border-t border-gray-800 mt-16 pt-8 text-center text-xs text-gray-500">
        &copy; 2026 Stylish Fox. All rights reserved.
      </div>
    </footer>
  );
}
