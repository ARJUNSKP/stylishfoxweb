'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { fetchStoreSettings, StoreSettingsData } from '@/utils/api';

export interface SettingsContextType {
  settings: StoreSettingsData;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: Partial<StoreSettingsData>) => void;
}

const defaultSettings: StoreSettingsData = {
  whatsappNumber: '918086388058',
  freeShippingThreshold: 2000,
  shippingFee: 149,
  offerText: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: false,
  refreshSettings: async () => {},
  updateLocalSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await fetchStoreSettings(true);
      if (data && data.whatsappNumber) {
        setSettings({
          ...defaultSettings,
          ...data,
          freeShippingThreshold: Number(data.freeShippingThreshold) || 2000,
          shippingFee: Number(data.shippingFee) || 149,
          offerText: data.offerText !== undefined ? data.offerText : defaultSettings.offerText,
        });
      }
    } catch (e) {
      console.error('Failed to load store settings:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocalSettings = useCallback((newSettings: Partial<StoreSettingsData>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      freeShippingThreshold:
        newSettings.freeShippingThreshold !== undefined
          ? Number(newSettings.freeShippingThreshold)
          : prev.freeShippingThreshold,
      shippingFee:
        newSettings.shippingFee !== undefined
          ? Number(newSettings.shippingFee)
          : prev.shippingFee,
      offerText:
        newSettings.offerText !== undefined
          ? newSettings.offerText
          : prev.offerText,
    }));
  }, []);

  useEffect(() => {
    refreshSettings();

    const handleSettingsUpdated = () => {
      refreshSettings();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('store_settings_updated', handleSettingsUpdated);
      return () => {
        window.removeEventListener('store_settings_updated', handleSettingsUpdated);
      };
    }
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        updateLocalSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
