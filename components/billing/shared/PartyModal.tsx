'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, MapPin, FileText, CheckCircle2 } from 'lucide-react';

interface PartyModalProps {
  initialData?: any;
  defaultType?: 'CUSTOMER' | 'VENDOR' | 'BOTH';
  onClose: () => void;
  onSuccess: (newParty: any) => void;
}

export default function PartyModal({
  initialData,
  defaultType = 'CUSTOMER',
  onClose,
  onSuccess,
}: PartyModalProps) {
  const isEditing = Boolean(initialData);

  const [partyType, setPartyType] = useState<'CUSTOMER' | 'VENDOR' | 'BOTH'>(
    initialData?.partyType || defaultType
  );
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email === 'pos@beeshubfarmland.com' ? '' : (initialData?.email || ''));
  const [address, setAddress] = useState(initialData?.address || '');
  const [gstin, setGstin] = useState(initialData?.gstin || '');
  const [openingBalance, setOpeningBalance] = useState(String(initialData?.openingBalance || 0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Party name and mobile phone are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const url = '/api/billing/parties';
      const method = isEditing ? 'PUT' : 'POST';
      const payload: any = {
        partyType,
        name,
        phone,
        email,
        address,
        gstin,
        openingBalance: Number(openingBalance || 0),
      };
      if (isEditing) {
        payload.partyId = initialData._id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || `Failed to ${isEditing ? 'update' : 'save'} party record.`);
      }
    } catch (err: any) {
      setError(err.message || `Server error ${isEditing ? 'updating' : 'creating'} party.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E8EDF2] shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-[#64748B]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ED3500]/10 text-[#ED3500] flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#163B5C]">
              {isEditing ? 'Edit' : 'Add New'} {partyType === 'VENDOR' ? 'Supplier / Vendor' : 'Customer'} Party
            </h3>
            <p className="text-xs text-[#64748B]">Create a ledger account for billing and payments.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            {(['CUSTOMER', 'VENDOR', 'BOTH'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPartyType(t)}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                  partyType === t
                    ? 'bg-[#163B5C] text-white border-[#163B5C]'
                    : 'bg-white text-[#64748B] border-[#E8EDF2] hover:bg-gray-50'
                }`}
              >
                {t === 'BOTH' ? 'Customer & Vendor' : t}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Party Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Foods Supplier / Kishore Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#163B5C] uppercase">Mobile Phone *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#163B5C] uppercase">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="33AAOCB0453D1Z3"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500] uppercase"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="vendor@beeshubfarmland.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#163B5C] uppercase">Address & Location</label>
            <textarea
              rows={2}
              placeholder="Street, City, State, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF2] text-xs focus:outline-none focus:border-[#ED3500]"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E8EDF2] font-bold text-xs text-[#64748B] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#ED3500]/25 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Party Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
