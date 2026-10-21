'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import LotusLoader from '@/components/LotusLoader';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { US_STATES } from '@/lib/tax/jurisdiction';
import { validateCustomerRegistration } from '@/lib/checkoutValidation';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';
  const isFromCheckout = redirectTarget === 'checkout';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    aptSuite: '',
    city: '',
    district: '',
    state: 'CA',
    zipCode: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Pre-flight client validation
    const validation = validateCustomerRegistration(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setErrorMessage(validation.firstErrorMessage || 'Please correct the highlighted form errors.');
      if (validation.firstErrorField) {
        const el = document.getElementById(`reg-${validation.firstErrorField}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Account registered successfully! Redirecting...');
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
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        setErrorMessage(data.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans pb-16 md:pb-0">
      {/* Storefront Header */}
      <Header />

      {/* Main Registration Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl p-6 sm:p-8">
          {/* Checkout Notice */}
          {isFromCheckout && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-[#0B3B24]">
              <ShoppingBag className="w-5 h-5 text-[#0B3B24] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-emerald-950">
                  Save Your Shipping Address for Easy Checkout
                </strong>
                <span>
                  Register with your US address below. Your details will be automatically pre-filled into checkout, and your cart is ready!
                </span>
              </div>
            </div>
          )}

          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Create Customer Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
              US Delivery Address &amp; Contact Information
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
            {/* Contact Information Group */}
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                1. Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.name
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="priya@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.email
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Phone Number (US) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      placeholder="(510) 555-0123"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.phone
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* US Shipping Address Group */}
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                2. US Delivery Address
              </h2>
              <div className="space-y-4">
                {/* Street Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-address"
                      type="text"
                      required
                      placeholder="e.g. 123 Mission Blvd"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.address
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.address}</p>
                  )}
                </div>

                {/* Apt / Suite */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Apartment / Suite / Unit <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-aptSuite"
                      type="text"
                      placeholder="Apt 4B, Suite 200, etc."
                      value={formData.aptSuite}
                      onChange={(e) => handleChange('aptSuite', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                    />
                  </div>
                </div>

                {/* City & District / County */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-city"
                      type="text"
                      required
                      placeholder="e.g. Fremont"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.city
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[11px] text-red-600 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                      District / County <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      id="reg-district"
                      type="text"
                      placeholder="e.g. Alameda County"
                      value={formData.district}
                      onChange={(e) => handleChange('district', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10 transition-all"
                    />
                    {fieldErrors.district && (
                      <p className="text-[11px] text-red-600 mt-1">{fieldErrors.district}</p>
                    )}
                  </div>
                </div>

                {/* State & ZIP Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                      US State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="reg-state"
                      required
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 bg-white focus:outline-none transition-all ${
                        fieldErrors.state
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    >
                      {Object.entries(US_STATES).map(([code, name]) => (
                        <option key={code} value={code}>
                          {code} — {name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.state && (
                      <p className="text-[11px] text-red-600 mt-1">{fieldErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                      ZIP Code (5 Digits) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="reg-zipCode"
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g. 94538"
                      value={formData.zipCode}
                      onChange={(e) => handleChange('zipCode', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.zipCode
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                    {fieldErrors.zipCode && (
                      <p className="text-[11px] text-red-600 mt-1">{fieldErrors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security / Password Group */}
            <div className="pb-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                3. Account Security
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Password (Min 6 chars) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.password
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
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
                  {fieldErrors.password && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-gray-900 focus:outline-none transition-all ${
                        fieldErrors.confirmPassword
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-gray-200 focus:border-[#0B3B24] focus:ring-2 focus:ring-[#0B3B24]/10'
                      }`}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] active:bg-[#0B3B24] text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Save Address</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login prompt */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'}
                className="font-semibold text-[#0B3B24] hover:underline"
              >
                Sign in here
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<LotusLoader label="Loading registration" />}>
      <RegisterFormContent />
    </Suspense>
  );
}
