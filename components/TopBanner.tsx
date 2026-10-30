'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

export default function TopBanner() {
  const { settings } = useSettings();
  const bannerText = settings?.offerText || ""

  if (!bannerText.trim()) return null;

  return (
    <div className="bg-[#fef08a] text-black text-center py-2 text-xs md:text-sm font-semibold tracking-wide px-4 transition-all">
      {bannerText}
    </div>
  );
}
