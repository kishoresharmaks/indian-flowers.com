'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LotusLoader from '@/components/LotusLoader';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get('type') === 'admin' ? 'admin' : 'customer';

  // Step 1: Request, Step 2: Code Verification & Direct Reset
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1: Send Reset Request
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, accountType }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep('verify');
        setResendCooldown(60);
        setSuccessMessage('We sent a 6-digit code and a secure reset link to your email.');
      } else {
        setErrorMessage(data.message || 'Unable to request password reset. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Instant Reset via 6-digit OTP
  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code from your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp,
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
        setErrorMessage(data.message || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while resetting password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setResending(true);
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, accountType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        setSuccessMessage('A fresh verification code has been dispatched to your email.');
      } else {
        setErrorMessage(data.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMessage('Network error resending code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Top Brand Accent Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0B3B24] text-white flex items-center justify-center mx-auto shadow-md shadow-[#0B3B24]/20">
              <KeyRound className="w-6 h-6 text-amber-300" />
            </div>
            <h1 className="text-2xl font-black text-[#0B3B24] tracking-tight">
              {step === 'request' ? 'Reset Your Password' : 'Enter Verification Code'}
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              {step === 'request'
                ? `Enter your ${accountType === 'admin' ? 'admin' : 'account'} email address and we'll send a 6-digit code and direct reset link.`
                : `We sent a 6-digit code to ${email}. You can reset your password below or click the link in your email.`}
            </p>
          </div>

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

          {/* STEP 1: REQUEST CODE */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-gray-100 text-center">
                <Link
                  href={accountType === 'admin' ? '/admin/login' : '/login'}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#0B3B24] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY CODE & SET NEW PASSWORD */}
          {step === 'verify' && (
            <form onSubmit={handleResetWithOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl font-extrabold tracking-[0.5em] py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="hover:text-gray-900 font-semibold cursor-pointer"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="text-[#0B3B24] font-bold hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LotusLoader label="Loading security portal" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
