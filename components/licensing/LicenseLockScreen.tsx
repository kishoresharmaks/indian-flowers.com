'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldAlert,
  CreditCard,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  AlertCircle,
  Key,
} from 'lucide-react';
import { IClientLicenseState } from '@/lib/licensing/licenseTypes';
import ManualPaymentModal from './ManualPaymentModal';
import { formatCurrency } from '@/lib/currency';

interface LicenseLockScreenProps {
  license: IClientLicenseState | null;
  onUnlocked: () => void;
}

export default function LicenseLockScreen({
  license,
  onUnlocked,
}: LicenseLockScreenProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [manualConfig, setManualConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPayingRazorpay, setIsPayingRazorpay] = useState<string | null>(null);
  const [selectedPlanForManual, setSelectedPlanForManual] = useState<any>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPlansAndConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/license/status');
      const data = await res.json();
      if (data.success) {
        if (data.license && !data.license.isLocked) {
          onUnlocked();
          return;
        }
        setPlans(data.plans || []);
        setRazorpayKeyId(data.razorpayKeyId || '');
        setManualConfig(data.manualPaymentConfig || null);
      }
    } catch (err) {
      console.error('Failed to load lock screen status', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndConfig();
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayRazorpay = async (plan: any) => {
    setFeedback(null);
    try {
      setIsPayingRazorpay(plan.planId);
      const orderRes = await fetch('/api/license/renew/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.planId,
          licenseKey: license?.licenseKey,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Order creation failed');
      }

      const options = {
        key: orderData.keyId || razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NEXUS PRODUCTS',
        description: `Subscription Renewal - ${plan.name}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/license/renew/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: plan.planId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              transactionId: orderData.transactionId,
              licenseKey: license?.licenseKey,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment verified! Your subscription is renewed.');
            onUnlocked();
          } else {
            setFeedback(verifyData.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: license?.businessName || 'Store Owner',
          email: 'client@nexus.local',
          contact: '9876543210',
        },
        theme: { color: '#F59E0B' },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK is not available.');
      }
    } catch (err: any) {
      setFeedback(err.message || 'Payment failed.');
    } finally {
      setIsPayingRazorpay(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto font-sans text-slate-100">
      <div className="w-full max-w-4xl space-y-6 my-auto">
        {/* Lock Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white">
            Software Subscription Expired
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Your software subscription for{' '}
            <strong className="text-slate-200">{license?.businessName || 'this store'}</strong> ended
            on{' '}
            <strong className="text-rose-400">
              {license?.validUntil ? new Date(license.validUntil).toLocaleDateString('en-US') : 'N/A'}
            </strong>
            . Please renew below to instantly reactivate POS, e-commerce, and admin management.
          </p>
        </div>

        {feedback && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-sm font-semibold rounded-2xl flex items-center gap-2 max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pricing options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isPopular = plan.billingCycle === 'YEARLY' || plan.isPopular;
            const isProcessing = isPayingRazorpay === plan.planId;

            return (
              <div
                key={plan.planId}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl ${
                  isPopular
                    ? 'border-amber-500 ring-2 ring-amber-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-extrabold text-slate-400">
                      {plan.billingCycle}
                    </span>
                    {isPopular && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-full">
                        Best Value
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-black text-white mt-1">{plan.name}</h4>
                  <div className="text-2xl font-black text-amber-400 mt-2">
                    {formatCurrency(plan.price)}
                    <span className="text-xs text-slate-400 font-normal"> / {plan.billingCycle.toLowerCase()}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handlePayRazorpay(plan)}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <CreditCard className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPlanForManual(plan);
                      setIsManualModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Pay via UPI / Bank
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support footer */}
        {manualConfig && (
          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>
              Need immediate assistance? Call Support:{' '}
              <a
                href={`tel:${manualConfig.supportPhone}`}
                className="text-amber-400 font-bold hover:underline"
              >
                {manualConfig.supportPhone}
              </a>
            </p>
          </div>
        )}
      </div>

      {manualConfig && (
        <ManualPaymentModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          selectedPlan={selectedPlanForManual}
          config={manualConfig}
          onPaymentSubmitted={() => {
            fetchPlansAndConfig();
          }}
        />
      )}
    </div>
  );
}
