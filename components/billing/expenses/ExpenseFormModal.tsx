'use client';

import React, { useState } from 'react';
import { X, Receipt, CheckCircle2 } from 'lucide-react';

interface ExpenseFormModalProps {
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseFormModal({
  categories,
  onClose,
  onSuccess,
}: ExpenseFormModalProps) {
  const [categoryName, setCategoryName] = useState(categories[0]?.name || 'General');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT_CARD' | 'CreditCard' | 'BANK_TRANSFER' | 'CHEQUE' | 'RAZORPAY' | 'UPI'>('CASH');
  const [paidTo, setPaidTo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || Number(amount) <= 0) {
      setError('Title and valid amount required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch('/api/billing/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          title,
          amount: Number(amount),
          paymentMode,
          paidTo,
          referenceNo,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to record expense.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error saving expense.');
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
          <div className="w-10 h-10 rounded-2xl bg-[#ED3500]/10 text-[#ED3500] flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#163B5C]">Log Daily Operational Expense</h3>
            <p className="text-xs text-[#64748B]">Record daily business expenses for accurate P&L tracking.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Expense Category *</label>
            <select
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold bg-white"
            >
              {categories.map((c) => (
                <option key={c._id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Expense Description / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Honey Jar Packaging Tape & Labels"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#163B5C] uppercase">Amount ($) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="e.g. 1200"
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
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Corporate Card</option>
                <option value="BANK_TRANSFER">Bank Transfer (ACH / Wire)</option>
                <option value="CHEQUE">Check</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Paid To (Vendor / Person)</label>
            <input
              type="text"
              placeholder="e.g. Packaging Trader Store"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
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
              className="flex-1 py-3 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Expense Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
