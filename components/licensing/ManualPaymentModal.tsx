'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Building,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: any;
  config: {
    upiId: string;
    upiName: string;
    qrCodeUrl: string;
    bankDetails: {
      accountName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
    };
    supportPhone: string;
    supportEmail: string;
  };
  onPaymentSubmitted: () => void;
}

export default function ManualPaymentModal({
  isOpen,
  onClose,
  selectedPlan,
  config,
  onPaymentSubmitted,
}: ManualPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerUpiOrAccount, setPayerUpiOrAccount] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !selectedPlan) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!utrNumber.trim()) {
      setErrorMsg('Please enter the 12-digit UTR or Transaction Reference number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/license/renew/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.planId,
          utrNumber: utrNumber.trim(),
          payerName: payerName.trim(),
          payerUpiOrAccount: payerUpiOrAccount.trim(),
          manualNotes: manualNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        onPaymentSubmitted();
      } else {
        setErrorMsg(data.message || 'Failed to submit payment details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Manual UPI / Bank Transfer</h3>
              <p className="text-xs text-slate-500">
                Direct bank transfer or UPI QR payment for {selectedPlan.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-slate-900">Payment Submitted Successfully!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your UTR Reference <strong className="font-mono text-slate-900">{utrNumber}</strong>{' '}
              for {formatCurrency(selectedPlan.price)} has been sent to our billing team.
              Your service will remain active without interruption while we verify bank credit.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            {/* Amount Payable Banner */}
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200/80 rounded-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Amount Payable
                </span>
                <h4 className="text-2xl font-black text-amber-950">
                  {formatCurrency(selectedPlan.price)}
                </h4>
              </div>
              <span className="px-3 py-1 bg-amber-200/60 text-amber-900 text-xs font-bold rounded-lg">
                {selectedPlan.billingCycle} PLAN
              </span>
            </div>

            {/* Payment Methods Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: UPI QR */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center space-y-3 flex flex-col items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Option 1: Scan UPI QR Code
                </span>
                {config.qrCodeUrl && (
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                    <img
                      src={config.qrCodeUrl}
                      alt="UPI QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  </div>
                )}
                <div className="w-full">
                  <p className="text-xs text-slate-500 mb-1">Pay to UPI ID:</p>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800">
                    <span>{config.upiId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.upiId, 'upiId')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                    >
                      {copiedField === 'upiId' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Option B: Bank Account */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider block">
                  Option 2: Direct Bank Transfer (IMPS / NEFT)
                </span>

                <div className="space-y-2.5">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Name</span>
                    <div className="flex items-center justify-between font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                      <span>{config.bankDetails.accountName}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(config.bankDetails.accountName, 'accName')
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        {copiedField === 'accName' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Number</span>
                    <div className="flex items-center justify-between font-mono font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                      <span>{config.bankDetails.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(config.bankDetails.accountNumber, 'accNum')
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        {copiedField === 'accNum' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                    <div className="flex items-center justify-between font-mono font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                      <span>{config.bankDetails.ifscCode}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(config.bankDetails.ifscCode, 'ifsc')
                        }
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        {copiedField === 'ifsc' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Bank Name & Branch</span>
                    <p className="font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      {config.bankDetails.bankName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="text-sm font-extrabold text-slate-900">
                Step 2: Enter Payment Confirmation Details
              </h4>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  12-Digit UTR / Transaction Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423589123456 or UPI Reference ID"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Payer Name / Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kishore Sharma"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Payer UPI ID / Account (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. username@okhdfcbank"
                    value={payerUpiOrAccount}
                    onChange={(e) => setPayerUpiOrAccount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Additional Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Google Pay at 10:30 AM"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? (
                    'Submitting Proof...'
                  ) : (
                    <>
                      Submit Payment Proof
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
