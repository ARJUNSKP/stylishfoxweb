'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { DEFAULT_STORE_WHATSAPP } from '@/utils/whatsapp';

export default function FloatingIcons() {
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_STORE_WHATSAPP).replace(/[^0-9]/g, '');
  const enquiryUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hello Stylish Fox Team, I have an inquiry regarding your heavyweight t-shirt collection.'
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href={enquiryUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Stylish Fox on WhatsApp"
        className="bg-[#25D366] hover:bg-[#1ebd59] text-black p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center cursor-pointer border-2 border-black/40 group"
      >
        <MessageCircle className="w-7 h-7 fill-black" />
        <span className="sr-only">WhatsApp Chat</span>
      </a>
    </div>
  );
}
