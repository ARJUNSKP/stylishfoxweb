import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function FloatingIcons() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button className="bg-[#128C7E] hover:bg-[#075E54] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center">
        <MessageCircle className="w-8 h-8" />
      </button>
    </div>
  );
}
