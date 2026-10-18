'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, UserPlus, FileText, X } from 'lucide-react';
import PartyModal from '../shared/PartyModal';
import { formatCurrency } from '@/lib/currency';

interface SaleInvoiceFormProps {
  docType: 'SALE_INVOICE' | 'QUOTATION' | 'PROFORMA' | 'SALE_ORDER' | 'SALE_RETURN';
  products: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaleInvoiceForm({
  docType,
  products,
  onClose,
  onSuccess,
}: SaleInvoiceFormProps) {
  const [parties, setParties] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'RAZORPAY' | 'CREDIT_CARD' | 'CreditCard' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT' | 'UPI'>('CASH');
  const [notes, setNotes] = useState('');

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch Customers
  useEffect(() => {
    fetch('/api/billing/parties?type=CUSTOMER')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setParties(data.data);
      })
      .catch(() => {});
  }, []);

  const handleSelectParty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedPartyId(pId);
    if (pId) {
      const p = parties.find((x) => x._id === pId);
      if (p) {
        setCustomerName(p.name);
        setCustomerPhone(p.phone);
        setCustomerEmail(p.email || '');
        setBillingAddress(p.address || '');
      }
    }
  };

  const handleAddItem = (productId: string) => {
    const p = products.find((x) => x._id === productId);
    if (!p) return;

    const variant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
    const price = variant ? Number(variant.price) : Number(p.price);
    const gst = Number(p.gst || 0);
    const qty = 1;

    const lineSubtotal = price * qty;
    const lineGst = (lineSubtotal * gst) / 100;
    const lineTotal = lineSubtotal + lineGst;

    setItems([
      ...items,
      {
        productId: p._id,
        name: p.name,
        variantName: variant ? variant.name : '',
        price,
        quantity: qty,
        gst,
        lineSubtotal,
        lineGst,
        lineTotal,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const gst = Number(item.gst || 0);

    item.lineSubtotal = price * qty;
    item.lineGst = (item.lineSubtotal * gst) / 100;
    item.lineTotal = item.lineSubtotal + item.lineGst;

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((s, i) => s + (i.lineSubtotal || 0), 0);
  const totalGst = items.reduce((s, i) => s + (i.lineGst || 0), 0);
  const grandTotal = items.reduce((s, i) => s + (i.lineTotal || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || items.length === 0) {
      setError('Customer name and at least 1 item are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await fetch('/api/billing/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          partyId: selectedPartyId,
          customerName,
          customerPhone,
          customerEmail,
          billingAddress,
          items,
          paidAmount: Number(paidAmount || 0),
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Failed to save sales document.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error creating sales document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-6 border border-[#E8EDF2] shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-[#64748B]"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-extrabold text-xl text-[#163B5C]">
            Create New {docType === 'SALE_ORDER' ? 'Sales Order' : docType === 'QUOTATION' ? 'Quotation' : docType === 'PROFORMA' ? 'Proforma Invoice' : docType === 'SALE_RETURN' ? 'Sales Return' : 'Sale Invoice'}
          </h3>
          <p className="text-xs text-[#64748B]">Fill in items, customer info, tax, and payment status.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Selection Grid */}
          <div className="p-4 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#163B5C] uppercase">Select Customer Party</label>
              <button
                type="button"
                onClick={() => setIsPartyModalOpen(true)}
                className="text-xs font-bold text-[#ED3500] hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + New Customer Party
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedPartyId}
                onChange={handleSelectParty}
                className="w-full px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold bg-white"
              >
                <option value="">-- Direct / Walk-in Customer --</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
              />
              <input
                type="tel"
                required
                placeholder="Mobile Phone *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Product Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#163B5C] uppercase">Select Products to Add</h4>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-[#ED3500]/40 text-xs font-bold text-[#ED3500] bg-[#FFF8F5]"
              >
                <option value="">+ Add Product Item to Bill</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {formatCurrency(p.price)} ({p.quantity ?? 0} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#E8EDF2] rounded-2xl text-xs text-[#64748B]">
                No items added yet. Select a product above to add items to this {docType}.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#E8EDF2]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                      <th className="p-3">Product Item</th>
                      <th className="p-3 w-28">Price ($)</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-24">Sales Tax %</th>
                      <th className="p-3 text-right">Total ($)</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDF2]">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <span className="font-bold text-[#163B5C] block">{item.name}</span>
                          {item.variantName && (
                            <span className="text-[10px] text-[#64748B]">{item.variantName}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs font-semibold"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs font-semibold"
                          />
                        </td>
                        <td className="p-3">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.gst === 0 ? '0' : (item.gst || '')}
                              onChange={(e) => handleUpdateItem(idx, 'gst', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full px-2 py-1 pr-4 border border-[#E8EDF2] rounded text-xs font-semibold focus:outline-none focus:border-[#163B5C]"
                            />
                            <span className="absolute right-1 text-[10px] text-gray-400 font-bold pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-extrabold text-[#163B5C]">
                          {formatCurrency(item.lineTotal)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals & Payment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FFFCFB] border border-[#E8EDF2]">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#163B5C]">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold bg-white"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="RAZORPAY">Razorpay Online</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer (ACH / Wire)</option>
                  <option value="CHEQUE">Check Payment</option>
                  <option value="CREDIT">On Credit (Net Terms)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#163B5C]">Paid Amount ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8EDF2] text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs text-right self-end">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Subtotal:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sales Tax:</span>
                <span className="font-bold">{formatCurrency(totalGst)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#ED3500] pt-1 border-t">
                <span>Grand Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600">
                <span>Balance Due:</span>
                <span>{formatCurrency(Math.max(0, grandTotal - Number(paidAmount || 0)))}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-[#E8EDF2] font-bold text-xs text-[#64748B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ED3500]/25 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Saving Document...' : `Save & Issue ${docType === 'SALE_ORDER' ? 'Sales Order' : docType === 'QUOTATION' ? 'Quotation' : docType === 'PROFORMA' ? 'Proforma Invoice' : docType === 'SALE_RETURN' ? 'Sales Return' : 'Sale Invoice'}`}
            </button>
          </div>
        </form>
      </div>

      {isPartyModalOpen && (
        <PartyModal
          defaultType="CUSTOMER"
          onClose={() => setIsPartyModalOpen(false)}
          onSuccess={(p) => {
            setParties([...parties, p]);
            setSelectedPartyId(p._id);
            setCustomerName(p.name);
            setCustomerPhone(p.phone);
          }}
        />
      )}
    </div>
  );
}
