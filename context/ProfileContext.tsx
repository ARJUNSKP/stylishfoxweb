'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  contactNumber: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  sameAsContact: true,
  email: 'arjun@example.com',
};

const defaultAddresses: Address[] = [
  {
    id: 'addr-1',
    tag: 'Home',
    name: 'Arjun Sivadas',
    phone: '+91 98765 43210',
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
    phone: '+91 98765 43210',
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
    phone: '+91 98765 43210',
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

  // Profile data
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefox_profile');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return defaultProfile;
  });

  // Billing / Main Addresses
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefox_addresses');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return defaultAddresses;
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefox_selected_address');
        if (saved) return saved;
      } catch {
        // ignore
      }
    }
    return defaultAddresses[0]?.id || '';
  });

  // Shipping Addresses
  const [shippingAddresses, setShippingAddresses] = useState<Address[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefox_shipping_addresses');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return defaultShippingAddresses;
  });

  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stylefox_selected_shipping_address');
        if (saved) return saved;
      } catch {
        // ignore
      }
    }
    return defaultShippingAddresses[0]?.id || '';
  });

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('stylefox_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('stylefox_addresses', JSON.stringify(addresses));
    } catch {}
  }, [addresses]);

  useEffect(() => {
    try {
      localStorage.setItem('stylefox_selected_address', selectedAddressId);
    } catch {}
  }, [selectedAddressId]);

  useEffect(() => {
    try {
      localStorage.setItem('stylefox_shipping_addresses', JSON.stringify(shippingAddresses));
    } catch {}
  }, [shippingAddresses]);

  useEffect(() => {
    try {
      localStorage.setItem('stylefox_selected_shipping_address', selectedShippingAddressId);
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
