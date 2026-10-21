'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';
  const isFromCheckout = redirectTarget === 'checkout';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Signed in successfully! Redirecting...');
        // If from checkout, redirect back to homepage with ?checkout=true
        if (isFromCheckout) {
          setTimeout(() => {
            router.push('/?checkout=true');
          }, 400);
        } else if (redirectTarget) {
          setTimeout(() => {
            router.push(redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`);
          }, 400);
        } else {
          setTimeout(() => {
            router.push('/account');
          }, 400);
        }
      } else {
        setErrorMessage(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans pb-16 md:pb-0">
      {/* Storefront Header */}
      <Header />

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8">
          {/* Checkout Notice Banner */}
          {isFromCheckout && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-[#0B3B24]">
              <ShoppingBag className="w-5 h-5 text-[#0B3B24] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-emerald-950">
                  Ready to Complete Your Order?
                </strong>
                <span>
                  Please sign in or create an account to proceed. Your shopping cart items are securely saved!
                </span>
              </div>
            </div>
          )}

          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Customer Sign In
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
              Access your saved delivery addresses and track fresh flower orders
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] active:bg-[#0B3B24] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Prompt */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              New to The Indian Flowers?{' '}
              <Link
                href={redirectTarget ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : '/register'}
                className="font-semibold text-[#0B3B24] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Storefront Footer */}
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
