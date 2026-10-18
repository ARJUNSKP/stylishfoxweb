'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authModalPrompt,
    setAuthModalPrompt,
    login,
    register,
  } = useProfile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage('');
    setSuccessNotice('');
    setAuthModalPrompt('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        if (!email || !password) {
          setErrorMessage('Please enter both your email address and password.');
          setLoading(false);
          return;
        }

        const res = await login({ email, password });
        if (!res.success) {
          setErrorMessage(res.error || 'Invalid email or password.');
        } else {
          setSuccessNotice('Welcome back! Loading your profile...');
        }
      } else {
        if (!name || !email || !password) {
          setErrorMessage('Please provide your name, email address, and a password.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const res = await register({
          name,
          email,
          password,
          phoneNumber: phoneNumber || undefined,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Registration failed. Please try another email.');
        } else {
          setSuccessNotice('Account created successfully! Loading your profile...');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@stylefox.com');
    setPassword('admin123456');
    setLoading(true);
    setErrorMessage('');
    const res = await login({ email: 'admin@stylefox.com', password: 'admin123456' });
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Demo login failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white z-10 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Badge */}
        <div className="flex items-center gap-2 mb-2 text-[#fef08a] text-[11px] font-black uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stylish Fox Member Access</span>
        </div>

        {/* Modal Title */}
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
          {authModalMode === 'login' ? 'Sign In To Account' : 'Create An Account'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1 mb-4 leading-relaxed">
          {authModalMode === 'login'
            ? 'Sign in to view your profile details, saved addresses, and manage orders.'
            : 'Register now to unlock your personalized profile and order management.'}
        </p>

        {/* WhatsApp Checkout Prompt Notice */}
        {authModalPrompt && (
          <div className="mb-4 p-3.5 bg-amber-950/70 border border-amber-500/50 rounded-xl flex items-start gap-2.5 text-amber-200 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Authentication Required For WhatsApp Order</p>
              <p className="text-[11px] text-amber-200/90 mt-0.5">{authModalPrompt}</p>
            </div>
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl mb-5 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-[#fef08a] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              authModalMode === 'register'
                ? 'bg-[#fef08a] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="leading-snug">{successNotice}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-[11px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                Full Name <span className="text-[#fef08a]">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Sivadas"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
              Email Address <span className="text-[#fef08a]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] transition-all"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-[11px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                Phone / WhatsApp Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 80863 88058"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
              Password <span className="text-[#fef08a]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authModalMode === 'register' ? 'Min 6 characters' : 'Enter password'}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#fef08a] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>
                  {authModalMode === 'login' ? 'Sign In & View Profile' : 'Register & View Profile'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Demo Login Shortcut */}
        {authModalMode === 'login' && (
          <div className="mt-4 pt-4 border-t border-zinc-900 text-center">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="text-xs text-zinc-400 hover:text-[#fef08a] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fef08a]" />
              <span>Quick Test: Sign in with Admin Demo account</span>
            </button>
          </div>
        )}

        {/* Bottom Switcher */}
        <div className="mt-5 text-center text-xs text-zinc-400">
          {authModalMode === 'login' ? (
            <span>
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('register');
                  setErrorMessage('');
                }}
                className="text-[#fef08a] font-bold hover:underline cursor-pointer ml-1"
              >
                Register here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setErrorMessage('');
                }}
                className="text-[#fef08a] font-bold hover:underline cursor-pointer ml-1"
              >
                Sign in here
              </button>
            </span>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure 256-Bit Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
}
