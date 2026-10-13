'use client';

import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  CheckCircle2,
  Phone,
  Mail,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { IClientLicenseState } from '@/lib/licensing/licenseTypes';

interface LicenseActivationModalProps {
  license: IClientLicenseState | null;
  onActivated: () => void;
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 3)}*****@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} *****`;
}

function getWhatsAppUrl(phone: string): string {
  const cleanDigits = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanDigits}?text=Hi%20NEXUS%20Support%2C%20I%20need%20assistance%20with%20my%20license%20key.`;
}

export default function LicenseActivationModal({
  license,
  onActivated,
}: LicenseActivationModalProps) {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch support contact details safely from ENV
  const supportEmail = process.env.NEXT_PUBLIC_LICENSE_SUPPORT_EMAIL || 'krishkishoreks@gmail.com';
  const supportPhone = process.env.NEXT_PUBLIC_LICENSE_SUPPORT_PHONE || '+917695946750';

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!licenseKeyInput.trim()) {
      setErrorMsg('Please enter your license key.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKeyInput.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('License activated successfully! Unlocking dashboard...');
        setTimeout(() => {
          onActivated();
        }, 1200);
      } else {
        setErrorMsg(data.message || 'License activation failed. Please check your key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot connect to licensing server. Please ensure the server is online.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = license?.status || 'UNLICENSED';
  const isSuspended = status === 'SUSPENDED';
  const isExpired = status === 'EXPIRED';
  const isInactive = status === 'INACTIVE';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-100 antialiased overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 my-auto">
        
        {/* Left Panel: Brand, Status Info & Masked WhatsApp/Email Contacts */}
        <div className="col-span-12 md:col-span-5 bg-slate-950 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-6">
          
          {/* Brand & Badge */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-xs font-black tracking-widest text-white uppercase">
                  NEXUS PRODUCTS
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-md">
                Security
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <h3 className="text-xl font-black text-white tracking-tight">
                {isSuspended
                  ? 'License Suspended'
                  : isExpired
                  ? 'Subscription Expired'
                  : isInactive
                  ? 'License Inactive'
                  : 'Software License Required'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {isSuspended
                  ? 'This store instance has been remotely suspended by NEXUS PRODUCTS.'
                  : isExpired
                  ? `Your subscription expired on ${license?.validUntil ? new Date(license.validUntil).toLocaleDateString('en-US') : 'N/A'}.`
                  : isInactive
                  ? 'This license key is currently inactive.'
                  : 'Enter your valid NEXUS PRODUCTS license key to unlock your store management, inventory, and POS counter.'}
              </p>
            </div>

            {/* Server Connection Status Card */}
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">Service Connection:</span>
                {license?.serverOnline === false ? (
                  <span className="font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    UNREACHABLE
                  </span>
                ) : (
                  <span className="font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    CONNECTED
                  </span>
                )}
              </div>

              {license?.serverOnline === false && (
                <div className="text-[11px] text-rose-300 bg-rose-950/80 p-2.5 rounded-xl border border-rose-800/80 leading-relaxed font-medium">
                  ⚠️ <strong>Service Connection Issue</strong>: Unable to reach the NEXUS Licensing Service. Please verify your connection or contact support.
                </div>
              )}
            </div>

            {/* Configured Key Info Card */}
            {license?.licenseKey && (
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Configured Key:</span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {license.licenseKey}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Server Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      license.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {license.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Support Section: Masked Contact Links */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Need Support?</span>
              <span className="text-[10px] text-slate-500 font-normal">Click to Connect</span>
            </div>

            <div className="space-y-2">
              {supportPhone && (
                <a
                  href={getWhatsAppUrl(supportPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-xl text-emerald-300 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-900/80 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400/80 font-medium">WhatsApp Support</div>
                      <div className="font-mono font-bold text-xs">{maskPhone(supportPhone)}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </a>
              )}

              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-slate-800 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Support Email</div>
                      <div className="font-mono font-bold text-xs">{maskEmail(supportEmail)}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-transform" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Activation Form */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-6 bg-slate-900">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Activate Your License
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Paste your NEXUS PRODUCTS license key below to authenticate and unlock full access.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase text-slate-300 tracking-wider">
                License Key *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="NEX-LIC-XXXX-XXXX-XXXX"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 tracking-wider transition-colors"
                />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Format: NEX-LIC-XXXX-XXXX-XXXX
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Authenticating Key...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Activate License & Unlock Store
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
