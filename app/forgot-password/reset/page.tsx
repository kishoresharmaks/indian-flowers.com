'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LotusLoader from '@/components/LotusLoader';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = (searchParams.get('email') || '').toLowerCase();
  const accountType = searchParams.get('type') === 'admin' ? 'admin' : 'customer';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      if (!token || !email) {
        setTokenValid(false);
        setVerifying(false);
        setErrorMessage('Invalid password reset link. Please request a new one.');
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(
            email
          )}&type=${accountType}`
        );
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setErrorMessage(data.message || 'This reset link has expired or has already been used.');
        }
      } catch (err) {
        setTokenValid(false);
        setErrorMessage('Network error validating reset link.');
      } finally {
        setVerifying(false);
      }
    }
    verify();
  }, [token, email, accountType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          accountType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Password reset successfully! Redirecting you to sign in...');
        setTimeout(() => {
          if (accountType === 'admin') {
            router.push('/admin/login');
          } else {
            router.push('/login');
          }
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error updating password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0B3B24] text-white flex items-center justify-center mx-auto shadow-md shadow-[#0B3B24]/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <h1 className="text-2xl font-black text-[#0B3B24] tracking-tight">
              Create New Password
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              Please enter your new password for <strong>{email}</strong>
            </p>
          </div>

          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#0B3B24] animate-spin mx-auto" />
              <p className="text-xs text-stone-500 font-semibold">Validating secure security token...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Link Expired or Invalid</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>

              <Link
                href={accountType === 'admin' ? '/forgot-password?type=admin' : '/forgot-password'}
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                Request a New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link
              href={accountType === 'admin' ? '/admin/login' : '/login'}
              className="text-xs font-semibold text-stone-600 hover:text-[#0B3B24] transition-colors"
            >
              &larr; Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LotusLoader label="Loading reset portal" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
