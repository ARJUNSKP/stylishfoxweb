'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface Address {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  contactNumber: string;
  whatsappNumber: string;
  sameAsContact: boolean;
  email: string;
}

interface ProfileContextType {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => void;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  addAddress: (addr: Omit<Address, 'id' | 'isDefault'>) => void;
  deleteAddress: (id: string) => void;
  shippingAddresses: Address[];
  selectedShippingAddressId: string;
  setSelectedShippingAddressId: (id: string) => void;
  addShippingAddress: (addr: Omit<Address, 'id' | 'isDefault'>) => void;
  deleteShippingAddress: (id: string) => void;
}

const defaultProfile: UserProfile = {
  firstName: 'Arjun',
  lastName: 'Sivadas',
  contactNumber: '+91 80863 88058',
  whatsappNumber: '+91 80863 88058',
  sameAsContact: true,
  email: 'arjun@example.com',
};

const defaultAddresses: Address[] = [
  {
    id: 'addr-1',
    tag: 'Home',
    name: 'Arjun Sivadas',
    phone: '+91 80863 88058',
    street: 'Flat 402, Skyline Luxury Apartments, MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    isDefault: true,
  },
  {
    id: 'addr-2',
    tag: 'Work',
    name: 'Arjun Sivadas',
    phone: '+91 80863 88058',
    street: 'Level 5, Cyber Park, Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    isDefault: false,
  },
];

const defaultShippingAddresses: Address[] = [
  {
    id: 'ship-1',
    tag: 'Home',
    name: 'Arjun Sivadas',
    phone: '+91 80863 88058',
    street: 'Flat 402, Skyline Luxury Apartments, MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    isDefault: true,
  },
];

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isHydrated = useRef(false);

  // Profile data
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  // Billing / Main Addresses
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddresses[0]?.id || ''
  );

  // Shipping Addresses
  const [shippingAddresses, setShippingAddresses] = useState<Address[]>(
    defaultShippingAddresses
  );
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>(
    defaultShippingAddresses[0]?.id || ''
  );

  // Hydrate from localStorage once on client mount to eliminate SSR hydration mismatch
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('stylefox_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedAddresses = localStorage.getItem('stylefox_addresses');
      if (savedAddresses) setAddresses(JSON.parse(savedAddresses));

      const savedSelectedAddress = localStorage.getItem('stylefox_selected_address');
      if (savedSelectedAddress) setSelectedAddressId(savedSelectedAddress);

      const savedShipping = localStorage.getItem('stylefox_shipping_addresses');
      if (savedShipping) setShippingAddresses(JSON.parse(savedShipping));

      const savedSelectedShipping = localStorage.getItem(
        'stylefox_selected_shipping_address'
      );
      if (savedSelectedShipping) setSelectedShippingAddressId(savedSelectedShipping);
    } catch {
      // ignore
    } finally {
      isHydrated.current = true;
    }
  }, []);

  // Persistence effects - only save after initial hydration
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem('stylefox_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem('stylefox_addresses', JSON.stringify(addresses));
    } catch {}
  }, [addresses]);

  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem('stylefox_selected_address', selectedAddressId);
    } catch {}
  }, [selectedAddressId]);

  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem(
        'stylefox_shipping_addresses',
        JSON.stringify(shippingAddresses)
      );
    } catch {}
  }, [shippingAddresses]);

  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      localStorage.setItem(
        'stylefox_selected_shipping_address',
        selectedShippingAddressId
      );
    } catch {}
  }, [selectedShippingAddressId]);

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (next.sameAsContact) {
        next.whatsappNumber = next.contactNumber;
      }
      return next;
    });
  };

  const addAddress = (addr: Omit<Address, 'id' | 'isDefault'>) => {
    const newId = `addr-${Date.now()}`;
    const newAddr: Address = {
      ...addr,
      id: newId,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [newAddr, ...prev]);
    setSelectedAddressId(newId);
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedAddressId === id) {
      const remaining = addresses.filter((a) => a.id !== id);
      if (remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
      }
    }
  };

  const addShippingAddress = (addr: Omit<Address, 'id' | 'isDefault'>) => {
    const newId = `ship-${Date.now()}`;
    const newAddr: Address = {
      ...addr,
      id: newId,
      isDefault: shippingAddresses.length === 0,
    };
    setShippingAddresses((prev) => [newAddr, ...prev]);
    setSelectedShippingAddressId(newId);
  };

  const deleteShippingAddress = (id: string) => {
    setShippingAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedShippingAddressId === id) {
      const remaining = shippingAddresses.filter((a) => a.id !== id);
      if (remaining.length > 0) {
        setSelectedShippingAddressId(remaining[0].id);
      }
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        isProfileOpen,
        setIsProfileOpen,
        profile,
        updateProfile,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        addAddress,
        deleteAddress,
        shippingAddresses,
        selectedShippingAddressId,
        setSelectedShippingAddressId,
        addShippingAddress,
        deleteShippingAddress,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
