'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  loginUser,
  registerUser,
  fetchUserProfile,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  setActiveUserAddress,
  deleteUserAddress,
  cacheUserProfile,
  invalidateUserProfileCache,
  refreshAuthToken,
} from '@/utils/api';

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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

interface ProfileContextType {
  // Auth state & modals
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  refreshSession: () => Promise<boolean>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot-password';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot-password') => void;
  openProfileOrAuth: () => void;
  login: (input: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Profile details & drawer
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  addAddress: (addr: Omit<Address, 'id' | 'isDefault'>) => Promise<{ success: boolean; error?: string }>;
  editAddress: (id: string, addr: Partial<Omit<Address, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  shippingAddresses: Address[];
  selectedShippingAddressId: string;
  setSelectedShippingAddressId: (id: string) => void;
  addShippingAddress: (addr: Omit<Address, 'id' | 'isDefault'>) => void;
  deleteShippingAddress: (id: string) => void;
  isSaving: boolean;

  // WhatsApp Checkout Prerequisites
  authModalPrompt: string;
  setAuthModalPrompt: (p: string) => void;
  profileDrawerNotice: string;
  setProfileDrawerNotice: (n: string) => void;
  profileDrawerInitialTab: 'details' | 'addresses';
  setProfileDrawerInitialTab: (tab: 'details' | 'addresses') => void;
  hasWhatsappNumber: boolean;
  hasDeliveryAddress: boolean;
  requireWhatsAppPrerequisites: (options?: { actionDescription?: string }) => boolean;
  isAdmin: boolean;
}

const emptyProfile: UserProfile = {
  firstName: '',
  lastName: '',
  contactNumber: '',
  whatsappNumber: '',
  sameAsContact: true,
  email: '',
};

export function parseBackendAddresses(rawAddresses: any[]): Address[] {
  if (!Array.isArray(rawAddresses)) return [];
  return rawAddresses.map((item, index) => {
    const addr = item && typeof item === 'object' && item.address ? item.address : item;
    const isActive = item?.ActiveAddress ?? addr?.isDefault ?? addr?.ActiveAddress ?? (index === 0);
    return {
      id: addr?.id || `addr-${index}-${Date.now()}`,
      tag: (addr?.tag as any) || 'Home',
      name: addr?.name || '',
      phone: addr?.phone || '',
      street: addr?.street || (typeof item?.address === 'string' ? item.address : ''),
      city: addr?.city || '',
      state: addr?.state || '',
      pincode: addr?.pincode || '',
      isDefault: Boolean(isActive),
    };
  });
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [authModalPrompt, setAuthModalPrompt] = useState('');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileDrawerNotice, setProfileDrawerNotice] = useState('');
  const [profileDrawerInitialTab, setProfileDrawerInitialTab] = useState<'details' | 'addresses'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const isHydrated = useRef(false);
  const hasSyncedInitialProfile = useRef(false);
  const isSyncingProfile = useRef(false);
  const isRefreshingToken = useRef(false);

  // Profile data defaults to empty until user logs in or registers
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);

  // Billing / Main Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Shipping Addresses
  const [shippingAddresses, setShippingAddresses] = useState<Address[]>([]);
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>('');

  // Admin Role Check
  const isAdmin = Boolean(user && user.role && user.role.toLowerCase() === 'admin');

  // WhatsApp Checkout Prerequisites Checks
  const hasWhatsappNumber = Boolean(
    profile.whatsappNumber?.trim() || profile.contactNumber?.trim()
  );

  const hasDeliveryAddress =
    addresses.length > 0 &&
    addresses.some(
      (a) => a.street?.trim() && a.city?.trim() && a.pincode?.trim()
    );

  const requireWhatsAppPrerequisites = (options?: { actionDescription?: string }): boolean => {
    const action = options?.actionDescription || 'place your order via WhatsApp';

    // 1. Must be signed in
    if (!isAuthenticated) {
      setAuthModalPrompt(`Please sign in or register to ${action}.`);
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
      return false;
    }

    // 2. Must have WhatsApp number
    const hasPhone = Boolean(profile.whatsappNumber?.trim() || profile.contactNumber?.trim());

    // 3. Must have a delivery address
    const hasAddr =
      addresses.length > 0 &&
      addresses.some((a) => a.street?.trim() && a.city?.trim() && a.pincode?.trim());

    if (!hasPhone && !hasAddr) {
      setProfileDrawerNotice(
        `Please add your WhatsApp number and delivery address to ${action}.`
      );
      setProfileDrawerInitialTab('details');
      setIsProfileOpen(true);
      return false;
    }

    if (!hasPhone) {
      setProfileDrawerNotice(
        `Please add your WhatsApp contact number to ${action}.`
      );
      setProfileDrawerInitialTab('details');
      setIsProfileOpen(true);
      return false;
    }

    if (!hasAddr) {
      setProfileDrawerNotice(
        `Please add your delivery address to ${action}.`
      );
      setProfileDrawerInitialTab('addresses');
      setIsProfileOpen(true);
      return false;
    }

    return true;
  };

  // Refresh session using refreshToken to get a fresh access token
  const refreshSession = async (): Promise<boolean> => {
    if (isRefreshingToken.current) return false;
    isRefreshingToken.current = true;
    try {
      const storedRefresh =
        refreshToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('stylefox_refresh_token') : null);

      if (!storedRefresh) {
        return false;
      }

      const res = await refreshAuthToken(storedRefresh);
      if (res.ok && res.data?.success && res.data?.data) {
        const { accessToken: newAccess, refreshToken: newRefresh, user: updatedUser } = res.data.data;
        const freshToken = newAccess || res.data.data.token;

        setToken(freshToken);
        if (newRefresh) {
          setRefreshToken(newRefresh);
        }
        if (updatedUser) {
          setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
        }

        try {
          localStorage.setItem('stylefox_token', freshToken);
          localStorage.setItem('token', freshToken);
          if (newRefresh) {
            localStorage.setItem('stylefox_refresh_token', newRefresh);
          }
        } catch {}

        return true;
      } else {
        // If refresh token is expired or invalid, log out
        console.warn('[ProfileContext] Refresh token expired or rejected');
        return false;
      }
    } catch (err) {
      console.warn('[ProfileContext] Error refreshing access token:', err);
      return false;
    } finally {
      isRefreshingToken.current = false;
    }
  };

  // Sync fresh profile & addresses from Backend DB with deduplication guard
  const syncProfileFromBackend = async (jwtToken: string, forceFresh: boolean = false) => {
    if (!jwtToken || isSyncingProfile.current) return;
    isSyncingProfile.current = true;
    try {
      const res = await fetchUserProfile(jwtToken, forceFresh);
      if (res.ok && res.data?.success && res.data?.data) {
        const u = res.data.data;
        const names = (u.name || '').trim().split(/\s+/);
        const fetchedProfile: UserProfile = {
          firstName: names[0] || 'Member',
          lastName: names.slice(1).join(' ') || '',
          email: u.email || '',
          contactNumber: u.phoneNumber || '',
          whatsappNumber: u.whatsappNumber || u.phoneNumber || '',
          sameAsContact: !u.whatsappNumber || u.whatsappNumber === u.phoneNumber,
        };
        setProfile(fetchedProfile);
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          phoneNumber: u.phoneNumber,
        });

        if (Array.isArray(u.address) && u.address.length > 0) {
          const parsed = parseBackendAddresses(u.address);
          setAddresses(parsed);
          const activeOne = parsed.find((a) => a.isDefault) || parsed[0];
          if (activeOne) {
            setSelectedAddressId(activeOne.id);
          }
        }
      } else if (res.status === 401) {
        // Access token expired! Attempt automatic refresh using refresh token
        const refreshed = await refreshSession();
        if (!refreshed) {
          logout();
        }
      }
    } catch (err) {
      console.warn('[ProfileContext] Error syncing profile from backend:', err);
    } finally {
      isSyncingProfile.current = false;
    }
  };

  // Hydrate from localStorage once on client mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('stylefox_token');
      const savedRefreshToken = localStorage.getItem('stylefox_refresh_token');
      const savedUser = localStorage.getItem('stylefox_user');
      const savedProfile = localStorage.getItem('stylefox_profile');

      if (savedRefreshToken) {
        setRefreshToken(savedRefreshToken);
      }

      if (savedToken && savedUser) {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          const names = (parsedUser.name || '').trim().split(/\s+/);
          setProfile({
            firstName: names[0] || 'Member',
            lastName: names.slice(1).join(' ') || '',
            email: parsedUser.email || '',
            contactNumber: parsedUser.phoneNumber || '',
            whatsappNumber: parsedUser.phoneNumber || '',
            sameAsContact: true,
          });
        }
        // Sync latest data from backend user table exactly once on initial mount
        if (!hasSyncedInitialProfile.current) {
          hasSyncedInitialProfile.current = true;
          syncProfileFromBackend(savedToken);
        }
      }

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
      if (isAuthenticated) {
        localStorage.setItem('stylefox_profile', JSON.stringify(profile));
      }
    } catch {}
  }, [profile, isAuthenticated]);

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

  const openProfileOrAuth = () => {
    if (isAuthenticated) {
      setProfileDrawerNotice('');
      setIsProfileOpen(true);
    } else {
      setAuthModalPrompt('');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const login = async (input: { email: string; password: string }) => {
    const res = await loginUser(input);
    if (res.ok && res.data.success && res.data.data) {
      const { user: userData, token: jwtToken, refreshToken: newRefreshToken } = res.data.data;
      const names = (userData.name || '').trim().split(/\s+/);
      const newProfile: UserProfile = {
        firstName: names[0] || 'Member',
        lastName: names.slice(1).join(' ') || '',
        email: userData.email || input.email,
        contactNumber: userData.phoneNumber || '',
        whatsappNumber: userData.whatsappNumber || userData.phoneNumber || '',
        sameAsContact: !userData.whatsappNumber || userData.whatsappNumber === userData.phoneNumber,
      };

      setToken(jwtToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
      setUser(userData);
      setProfile(newProfile);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);

      if (Array.isArray(userData.address) && userData.address.length > 0) {
        const parsed = parseBackendAddresses(userData.address);
        setAddresses(parsed);
        const activeOne = parsed.find((a) => a.isDefault) || parsed[0];
        if (activeOne) setSelectedAddressId(activeOne.id);
      }

      try {
        localStorage.setItem('stylefox_token', jwtToken);
        localStorage.setItem('token', jwtToken);
        if (newRefreshToken) {
          localStorage.setItem('stylefox_refresh_token', newRefreshToken);
        }
        localStorage.setItem('stylefox_user', JSON.stringify(userData));
        localStorage.setItem('stylefox_profile', JSON.stringify(newProfile));
      } catch {}

      // Cache user profile from login response to eliminate redundant /users/profile fetch
      cacheUserProfile(jwtToken, userData);
      hasSyncedInitialProfile.current = true;

      // ONLY AFTER LOGIN: Open Profile Drawer so details are displayed!
      setIsProfileOpen(true);
      return { success: true };
    }

    return {
      success: false,
      error: res.data?.message || 'Invalid email or password. Please try again.',
    };
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
  }) => {
    const res = await registerUser(input);
    if (res.ok && res.data.success && res.data.data) {
      const { user: userData, token: jwtToken, refreshToken: newRefreshToken } = res.data.data;
      const names = (userData.name || input.name || '').trim().split(/\s+/);
      const newProfile: UserProfile = {
        firstName: names[0] || 'Member',
        lastName: names.slice(1).join(' ') || '',
        email: userData.email || input.email,
        contactNumber: userData.phoneNumber || input.phoneNumber || '',
        whatsappNumber: userData.whatsappNumber || userData.phoneNumber || input.phoneNumber || '',
        sameAsContact: true,
      };

      setToken(jwtToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
      setUser(userData);
      setProfile(newProfile);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);

      try {
        localStorage.setItem('stylefox_token', jwtToken);
        localStorage.setItem('token', jwtToken);
        if (newRefreshToken) {
          localStorage.setItem('stylefox_refresh_token', newRefreshToken);
        }
        localStorage.setItem('stylefox_user', JSON.stringify(userData));
        localStorage.setItem('stylefox_profile', JSON.stringify(newProfile));
      } catch {}

      // Cache user profile from register response to eliminate redundant /users/profile fetch
      cacheUserProfile(jwtToken, userData);
      hasSyncedInitialProfile.current = true;

      // ONLY AFTER REGISTER: Open Profile Drawer so details are displayed!
      setIsProfileOpen(true);
      return { success: true };
    }

    return {
      success: false,
      error: res.data?.message || 'Registration failed. Email may already be in use.',
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setProfile(emptyProfile);
    setAddresses([]);
    setSelectedAddressId('');
    setIsProfileOpen(false);
    hasSyncedInitialProfile.current = false;
    invalidateUserProfileCache(token || undefined);
    try {
      localStorage.removeItem('stylefox_token');
      localStorage.removeItem('token');
      localStorage.removeItem('stylefox_refresh_token');
      localStorage.removeItem('stylefox_user');
      localStorage.removeItem('stylefox_profile');
      localStorage.removeItem('stylefox_addresses');
      localStorage.removeItem('stylefox_selected_address');
    } catch {}
  };

  // Update profile in local state and in backend database user table
  const updateProfile = async (
    updated: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    const next: UserProfile = { ...profile, ...updated };
    if (next.sameAsContact) {
      next.whatsappNumber = next.contactNumber;
    }
    setProfile(next);
    try {
      localStorage.setItem('stylefox_profile', JSON.stringify(next));
    } catch {}

    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('stylefox_token') : null);

    if (currentToken) {
      setIsSaving(true);
      try {
        const fullName = `${next.firstName} ${next.lastName}`.trim();
        const res = await updateUserProfile(currentToken, {
          name: fullName || undefined,
          phoneNumber: next.contactNumber || null,
          whatsappNumber: next.whatsappNumber || null,
        });

        if (!res.ok || !res.data?.success) {
          return {
            success: false,
            error: res.data?.message || 'Failed to update profile on server',
          };
        }

        if (res.data?.data) {
          const u = res.data.data;
          setUser((prev) => (prev ? { ...prev, name: u.name, phoneNumber: u.phoneNumber } : prev));
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error updating profile' };
      } finally {
        setIsSaving(false);
      }
    }

    return { success: true };
  };

  // Add address to local state and persist to database user table
  const addAddress = async (
    addr: Omit<Address, 'id' | 'isDefault'>
  ): Promise<{ success: boolean; error?: string }> => {
    const newId = `addr-${Date.now()}`;
    const newAddr: Address = {
      ...addr,
      id: newId,
      isDefault: addresses.length === 0,
    };
    const nextAddresses = [newAddr, ...addresses];
    setAddresses(nextAddresses);
    setSelectedAddressId(newId);

    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('stylefox_token') : null);

    if (currentToken) {
      setIsSaving(true);
      try {
        const res = await addUserAddress(currentToken, {
          address: {
            id: newId,
            tag: newAddr.tag,
            name: newAddr.name,
            phone: newAddr.phone,
            street: newAddr.street,
            city: newAddr.city,
            state: newAddr.state,
            pincode: newAddr.pincode,
            isDefault: true,
          },
          ActiveAddress: true,
        });

        if (res.ok && res.data?.success && res.data?.data) {
          if (Array.isArray(res.data.data.address)) {
            const fresh = parseBackendAddresses(res.data.data.address);
            setAddresses(fresh);
            const active = fresh.find((a) => a.isDefault) || fresh[0];
            if (active) setSelectedAddressId(active.id);
          }
        }
      } catch (err: any) {
        console.warn('[ProfileContext] Error adding address to backend:', err);
      } finally {
        setIsSaving(false);
      }
    }

    return { success: true };
  };

  // Edit existing address and persist to database user table
  const editAddress = async (
    id: string,
    updatedFields: Partial<Omit<Address, 'id'>>
  ): Promise<{ success: boolean; error?: string }> => {
    const index = addresses.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: 'Address not found' };
    }

    const currentAddr = addresses[index];
    const mergedAddr: Address = {
      ...currentAddr,
      ...updatedFields,
      id,
    };

    const nextAddresses = [...addresses];
    nextAddresses[index] = mergedAddr;
    setAddresses(nextAddresses);

    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('stylefox_token') : null);

    if (currentToken) {
      setIsSaving(true);
      try {
        const res = await updateUserAddress(currentToken, index, {
          address: {
            id,
            tag: mergedAddr.tag,
            name: mergedAddr.name,
            phone: mergedAddr.phone,
            street: mergedAddr.street,
            city: mergedAddr.city,
            state: mergedAddr.state,
            pincode: mergedAddr.pincode,
            isDefault: mergedAddr.isDefault,
          },
          ActiveAddress: mergedAddr.isDefault,
        });

        if (res.ok && res.data?.success && res.data?.data) {
          if (Array.isArray(res.data.data.address)) {
            const fresh = parseBackendAddresses(res.data.data.address);
            setAddresses(fresh);
            const active = fresh.find((a) => a.isDefault) || fresh[0];
            if (active) setSelectedAddressId(active.id);
          }
        }
      } catch (err: any) {
        console.warn('[ProfileContext] Error updating address in backend:', err);
      } finally {
        setIsSaving(false);
      }
    }

    return { success: true };
  };

  // Delete address from local state and remove from database user table
  const deleteAddress = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const index = addresses.findIndex((a) => a.id === id);
    const remaining = addresses.filter((a) => a.id !== id);
    setAddresses(remaining);
    if (selectedAddressId === id) {
      if (remaining.length > 0) {
        setSelectedAddressId(remaining[0].id);
      }
    }

    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('stylefox_token') : null);

    if (currentToken && index >= 0) {
      setIsSaving(true);
      try {
        const res = await deleteUserAddress(currentToken, index);
        if (res.ok && res.data?.success && res.data?.data) {
          if (Array.isArray(res.data.data.address)) {
            const fresh = parseBackendAddresses(res.data.data.address);
            setAddresses(fresh);
            const active = fresh.find((a) => a.isDefault) || fresh[0];
            if (active) setSelectedAddressId(active.id);
          }
        }
      } catch (err: any) {
        console.warn('[ProfileContext] Error deleting address from backend:', err);
      } finally {
        setIsSaving(false);
      }
    }

    return { success: true };
  };

  const handleSetSelectedAddressId = (id: string) => {
    setSelectedAddressId(id);
    const index = addresses.findIndex((a) => a.id === id);
    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('stylefox_token') : null);
    if (currentToken && index >= 0) {
      setActiveUserAddress(currentToken, index).catch((err) => {
        console.warn('[ProfileContext] Error setting active address:', err);
      });
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
        isAuthenticated,
        user,
        token,
        refreshToken,
        refreshSession,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openProfileOrAuth,
        login,
        register,
        logout,
        isProfileOpen,
        setIsProfileOpen,
        profile,
        updateProfile,
        addresses,
        selectedAddressId,
        setSelectedAddressId: handleSetSelectedAddressId,
        addAddress,
        editAddress,
        deleteAddress,
        shippingAddresses,
        selectedShippingAddressId,
        setSelectedShippingAddressId,
        addShippingAddress,
        deleteShippingAddress,
        isSaving,
        authModalPrompt,
        setAuthModalPrompt,
        profileDrawerNotice,
        setProfileDrawerNotice,
        profileDrawerInitialTab,
        setProfileDrawerInitialTab,
        hasWhatsappNumber,
        hasDeliveryAddress,
        requireWhatsAppPrerequisites,
        isAdmin,
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
