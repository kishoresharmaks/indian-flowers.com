'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Key,
  CheckCircle2,
  Zap,
  CreditCard,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  HelpCircle,
  Phone,
  Mail,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { IClientLicenseState } from '@/lib/licensing/licenseTypes';
import ManualPaymentModal from './ManualPaymentModal';
import { formatCurrency } from '@/lib/currency';

interface SubscriptionTabProps {
  initialLicense?: IClientLicenseState | null;
  onRefreshLicense?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionTab({
  initialLicense,
  onRefreshLicense,
}: SubscriptionTabProps) {
  const [licenseState, setLicenseState] = useState<IClientLicenseState | null>(
    initialLicense || null
  );
  const [plans, setPlans] = useState<any[]>([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [manualConfig, setManualConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!initialLicense);
  const [isPayingRazorpay, setIsPayingRazorpay] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );

  // Manual payment modal state
  const [selectedPlanForManual, setSelectedPlanForManual] = useState<any>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchLicenseDetails = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.success) {
        setLicenseState(data.license);
        setPlans(data.plans || []);
        setRazorpayKeyId(data.razorpayKeyId || '');
        setManualConfig(data.manualPaymentConfig || null);
      }
    } catch (err: any) {
      console.error('Failed to load subscription details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseDetails();
    // Dynamically inject Razorpay Checkout SDK script if not already present
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Online Renewal via Licensing Authority Server Hosted Razorpay Checkout
  const handlePayWithRazorpay = (plan: any) => {
    const serverUrl =
      licenseState?.licensingServerUrl ||
      process.env.NEXT_PUBLIC_LICENSING_SERVER_URL ||
      process.env.LICENSING_SERVER_URL ||
      '';
    const key = licenseState?.licenseKey || '';
    const returnUrl = encodeURIComponent(window.location.href);
    const checkoutUrl = `${serverUrl.replace(/\/$/, '')}/checkout?key=${encodeURIComponent(key)}&planId=${encodeURIComponent(plan.planId)}&returnUrl=${returnUrl}`;
    window.open(checkoutUrl, '_blank');
  };

  const handleOpenManualPayment = (plan: any) => {
    setSelectedPlanForManual(plan);
    setIsManualModalOpen(true);
  };

  if (isLoading && !licenseState) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
        <p className="text-sm font-semibold">Loading subscription and billing details...</p>
      </div>
    );
  }

  const daysLeft = licenseState?.daysRemaining ?? 0;
  const isExpiring = daysLeft <= 7 && daysLeft >= 0;
  const isGrace = licenseState?.isGracePeriod;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-bold shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. CURRENT SUBSCRIPTION CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Background glow decorative */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 ${
                  licenseState?.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : licenseState?.status === 'GRACE_PERIOD'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {licenseState?.status === 'ACTIVE' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" />
                )}
                {licenseState?.status || 'ACTIVE'}
              </span>

              <span className="text-xs text-slate-400 font-mono">
                Cycle: {licenseState?.billingCycle || 'YEARLY'}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {licenseState?.planName || 'Pro POS & E-Commerce Subscription'}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{licenseState?.licenseKey}</span>
                <button
                  onClick={() => copyLicenseKey(licenseState?.licenseKey || '')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                  title="Copy License Key"
                >
                  {copiedKey ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 border-l border-slate-700 pl-4">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Valid Until:{' '}
                  <strong className="text-white font-bold">
                    {licenseState?.validUntil
                      ? new Date(licenseState.validUntil).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Days Countdown Dial / Progress */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-center min-w-[200px] shrink-0">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Time Remaining
            </span>
            <div className="text-3xl md:text-4xl font-black text-amber-400">
              {daysLeft > 0 ? `${daysLeft} Days` : isGrace ? 'Grace Period' : 'Expired'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {daysLeft > 0
                ? 'All store & POS features fully active'
                : isGrace
                ? '3-day emergency buffer active'
                : 'Renew to restore full access'}
            </p>
          </div>
        </div>

        {/* Feature badges row */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Included in Plan:
          </span>
          {licenseState?.features?.posEnabled !== false ? (
            <span className="px-3 py-1 bg-emerald-500/10 text-xs font-semibold text-emerald-300 rounded-lg flex items-center gap-1.5 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> POS Billing & Counter
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-800/60 text-xs font-semibold text-slate-400 rounded-lg flex items-center gap-1.5 border border-slate-700/60 line-through opacity-70">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> POS Billing & Counter (Locked)
            </span>
          )}

          {licenseState?.features?.invoicingEnabled !== false ? (
            <span className="px-3 py-1 bg-emerald-500/10 text-xs font-semibold text-emerald-300 rounded-lg flex items-center gap-1.5 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> GST Invoicing & Quotations
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-800/60 text-xs font-semibold text-slate-400 rounded-lg flex items-center gap-1.5 border border-slate-700/60 line-through opacity-70">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> GST Invoicing & Quotations (Locked)
            </span>
          )}
        </div>
      </div>

      {/* 2. SUBSCRIPTION RENEWAL PLANS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Renew or Upgrade Subscription
            </h3>
            <p className="text-xs text-slate-500">
              Select your billing cycle. Renew anytime to automatically add days to your current plan.
            </p>
          </div>
          <button
            onClick={fetchLicenseDetails}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.isPopular || plan.billingCycle === 'YEARLY';
            const isProcessing = isPayingRazorpay === plan.planId;

            return (
              <div
                key={plan.planId}
                className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between relative shadow-sm hover:shadow-lg ${
                  isPopular
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                    Most Popular (Save 25%)
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                      {plan.billingCycle}
                    </span>
                    <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100">
                    <span className="text-3xl font-black text-slate-900">
                      {formatCurrency(plan.price)}
                    </span>
                    {plan.discountPrice && plan.discountPrice > plan.price && (
                      <span className="text-xs text-slate-400 line-through font-semibold">
                        {formatCurrency(plan.discountPrice)}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">
                      / {plan.billingCycle.toLowerCase()}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Instant License Extension</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>POS Billing & Counter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>GST Invoicing & Quotations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Free Software Updates & Support</span>
                    </li>
                  </ul>
                </div>

                {/* Dual Payment Options: Razorpay & Manual */}
                <div className="space-y-2 pt-6 mt-4 border-t border-slate-100">
                  {/* Option 1: Instant Razorpay */}
                  <button
                    onClick={() => handlePayWithRazorpay(plan)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing ? 'Opening Gateway...' : 'Pay Online (Razorpay)'}
                  </button>

                  {/* Option 2: Manual UPI / Bank */}
                  <button
                    onClick={() => handleOpenManualPayment(plan)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    Pay via UPI QR / Bank
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SUPPORT & BILLING HELP BANNER */}
      {manualConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Need Help with Billing or Custom Invoicing?</h4>
              <p className="text-xs text-slate-500">
                Contact our customer support team for GST tax invoices or enterprise custom setups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {manualConfig.supportPhone && (
              <a
                href={`tel:${manualConfig.supportPhone.replace(/[^0-9+]/g, '')}`}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                {manualConfig.supportPhone}
              </a>
            )}
            {manualConfig.supportEmail && (
              <a
                href={`mailto:${manualConfig.supportEmail}`}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                {manualConfig.supportEmail}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Manual Payment Modal */}
      {manualConfig && (
        <ManualPaymentModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          selectedPlan={selectedPlanForManual}
          config={manualConfig}
          onPaymentSubmitted={() => {
            fetchLicenseDetails();
            if (onRefreshLicense) onRefreshLicense();
          }}
        />
      )}
    </div>
  );
}
