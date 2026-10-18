'use client';

import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface PaymentOutModalProps {
  linkedDoc?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentOutModal({
  linkedDoc,
  onClose,
  onSuccess,
}: PaymentOutModalProps) {
  const [partyName, setPartyName] = useState(linkedDoc?.vendorName || '');
  const [partyPhone, setPartyPhone] = useState(linkedDoc?.vendorPhone || '');
  const [amount, setAmount] = useState(linkedDoc?.balanceAmount ? String(linkedDoc.balanceAmount) : '');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT_CARD' | 'CreditCard' | 'BANK_TRANSFER' | 'CHEQUE' | 'RAZORPAY' | 'UPI'>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !amount || Number(amount) <= 0) {
      setError('Vendor name and valid payment amount are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'PAYMENT_OUT',
          partyId: linkedDoc?.vendorId || '',
          partyName,
          partyPhone,
          amount: Number(amount),
          paymentMode,
          referenceNo,
          docId: linkedDoc?._id || '',
          docNumber: linkedDoc?.docNumber || '',
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to record payment out.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error recording payment out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-hidden">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-6 space-y-5 border border-[#E8EDF2] shadow-2xl relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-[#64748B]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#163B5C]">Record Vendor Payment Out</h3>
            <p className="text-xs text-[#64748B]">
              {linkedDoc ? `Linked to Purchase Bill #${linkedDoc.docNumber}` : 'Record payout to supplier'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Vendor / Farmer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Honey Producer Co-op"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Amount Paid Out ($) *</label>
            <input
              type="number"
              required
              min="0.01"
              step="any"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-sm font-black text-rose-600 focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e: any) => setPaymentMode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold bg-white"
            >
              <option value="CASH">Cash Payout</option>
              <option value="CREDIT_CARD">Corporate Card</option>
              <option value="BANK_TRANSFER">Bank Transfer (ACH / Wire)</option>
              <option value="CHEQUE">Check Payout</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Reference / Check No. (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Wire Ref / Check #1042"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E8EDF2] font-bold text-xs text-[#64748B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Payment Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
