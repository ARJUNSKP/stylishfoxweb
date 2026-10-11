'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Plus,
  Check,
  Trash2,
  Save,
  Building,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export default function ProfileDrawer() {
  const {
    isProfileOpen,
    setIsProfileOpen,
    profile,
    updateProfile,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    addAddress,
    deleteAddress,
  } = useProfile();

  // Active sub-tab in panel
  const [activeTab, setActiveTab] = useState<'details' | 'addresses'>('details');

  // Local state for personal details editing
  const [formData, setFormData] = useState({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Address creation form states
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: `${profile.firstName} ${profile.lastName}`.trim() || '',
    phone: profile.contactNumber || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    tag: 'Home' as 'Home' | 'Work' | 'Other',
  });

  if (!isProfileOpen) return null;

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.street || !newAddr.city || !newAddr.pincode) {
      alert('Please fill out all address fields');
      return;
    }
    addAddress(newAddr);
    setShowAddAddressForm(false);
    setNewAddr({
      name: `${profile.firstName} ${profile.lastName}`.trim() || '',
      phone: profile.contactNumber || '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      tag: 'Home',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsProfileOpen(false)}
      />

      {/* Slide-in panel from the LEFT - full width on mobile, max-w-md on tablet/desktop */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-0 sm:pr-10">
        <div className="w-screen max-w-full sm:max-w-md bg-zinc-950 border-r border-zinc-800 text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
          {/* Top Panel Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-3">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#fef08a] font-black text-xs sm:text-sm">
                {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  {profile.firstName || 'My'} {profile.lastName || 'Account'}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate max-w-[170px] sm:max-w-[200px]">
                  {profile.email || 'Stylish Fox Member'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsProfileOpen(false)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              aria-label="Close profile panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 sm:py-2.5 px-3 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-black text-[#fef08a] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 py-2 sm:py-2.5 px-3 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-black text-[#fef08a] shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Addresses</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* ================= TAB 1: MY DETAILS ================= */}
            {activeTab === 'details' && (
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <h3 className="text-xs uppercase font-extrabold text-zinc-300 tracking-wider">
                    Personal Information
                  </h3>
                  {savedSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" /> Saved Successfully!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="e.g. Arjun"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="e.g. Sivadas"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          contactNumber: val,
                          whatsappNumber: prev.sameAsContact ? val : prev.whatsappNumber,
                        }));
                      }}
                      placeholder="+91 80863 88058"
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase text-zinc-400">
                      WhatsApp Number
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sameAsContact}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            sameAsContact: checked,
                            whatsappNumber: checked ? prev.contactNumber : prev.whatsappNumber,
                          }));
                        }}
                        className="rounded border-zinc-700 text-[#fef08a] focus:ring-0 accent-[#fef08a]"
                      />
                      <span>Same as contact</span>
                    </label>
                  </div>
                  <div className="relative">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      disabled={formData.sameAsContact}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsappNumber: e.target.value })
                      }
                      placeholder="+91 80863 88058"
                      className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-60 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@domain.com"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#fef08a] text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2 rounded cursor-pointer shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Personal Details</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 2: SAVED ADDRESSES (SELECTABLE & ADDABLE) ================= */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold text-zinc-300 tracking-wider">
                      Select Primary Address
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Choose your default profile address
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                    className="p-1.5 bg-[#fef08a] text-black rounded hover:bg-yellow-300 transition-colors flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddAddressForm ? 'Cancel' : 'Add New'}</span>
                  </button>
                </div>

                {/* Inline New Address Form */}
                {showAddAddressForm && (
                  <form
                    onSubmit={handleAddNewAddress}
                    className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#fef08a]">
                        Add Address
                      </span>
                      <div className="flex gap-1.5">
                        {(['Home', 'Work', 'Other'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewAddr({ ...newAddr, tag: t })}
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border transition-colors ${
                              newAddr.tag === t
                                ? 'bg-[#fef08a] text-black border-[#fef08a]'
                                : 'bg-black text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={newAddr.name}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, name: e.target.value })
                        }
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddr.phone}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, phone: e.target.value })
                        }
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"
                        required
                      />
                    </div>

                    <textarea
                      placeholder="Street, Flat/House No, Landmark"
                      value={newAddr.street}
                      onChange={(e) =>
                        setNewAddr({ ...newAddr, street: e.target.value })
                      }
                      rows={2}
                      className="w-full bg-black border border-zinc-700 rounded p-2 text-xs text-white resize-none"
                      required
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddr.city}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, city: e.target.value })
                        }
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddr.state}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, state: e.target.value })
                        }
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={newAddr.pincode}
                        onChange={(e) =>
                          setNewAddr({ ...newAddr, pincode: e.target.value })
                        }
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#fef08a] text-black font-bold text-xs uppercase rounded hover:bg-yellow-300 transition-colors cursor-pointer"
                    >
                      Save Address
                    </button>
                  </form>
                )}

                {/* List of selectable addresses */}
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      No addresses saved yet. Click &quot;Add New&quot; to create one.
                    </div>
                  ) : (
                    addresses.map((addr) => {
                      const isSelected = addr.id === selectedAddressId;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-3.5 rounded-lg border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'bg-zinc-900 border-[#fef08a] shadow-lg ring-1 ring-[#fef08a]'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-[#fef08a] bg-[#fef08a]'
                                    : 'border-zinc-600'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                )}
                              </div>
                              <span className="text-xs font-bold uppercase text-white">
                                {addr.name}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                                {addr.tag === 'Work' ? (
                                  <Building className="w-2.5 h-2.5" />
                                ) : (
                                  <Home className="w-2.5 h-2.5" />
                                )}
                                {addr.tag}
                              </span>
                            </div>

                            {addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAddress(addr.id);
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                                title="Delete address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                            {addr.street}, {addr.city}, {addr.state} -{' '}
                            <span className="font-bold text-white">
                              {addr.pincode}
                            </span>
                          </p>
                          <p className="text-[11px] text-zinc-400 pl-6 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{addr.phone}</span>
                          </p>

                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center gap-1 text-[11px] text-[#fef08a] font-bold pl-6">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active Primary Address</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
