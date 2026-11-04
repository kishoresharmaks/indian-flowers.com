'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Calendar,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flower2,
  Loader2,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { getMinDeliveryDateString, formatReadableDate, isBeforeMinDeliveryDate } from '@/lib/dateUtils';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    _id?: string;
    name?: string;
    slug?: string;
    image?: string;
    code?: string;
  } | null;
  selectedVariant?: {
    name?: string;
    price?: number;
    mrp?: number;
  } | null;
}

export default function CustomOrderModal({
  isOpen,
  onClose,
  product,
  selectedVariant,
}: CustomOrderModalProps) {
  const minDeliveryDate = getMinDeliveryDateString(10);

  // Form State
  const [productCode, setProductCode] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [variantName, setVariantName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [size, setSize] = useState('');
  const [preferredColor, setPreferredColor] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // UI state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{ inquiryId: string } | null>(null);

  // Helper to extract code from name or slug (e.g. "RP85", "CG27", "BR30", "DG04")
  const extractCode = (nameOrSlug: string = '') => {
    const match = nameOrSlug.match(/\b([A-Za-z]{2,6}[-\s]?\d{1,3})\b/);
    if (match) return match[1].replace(/[-\s]/g, '').toUpperCase();
    return '';
  };

  // Initialize from props when opened
  useEffect(() => {
    if (!isOpen) {
      setSuccessData(null);
      setErrorMessage('');
      return;
    }

    const initialCode = product?.code || extractCode(product?.name || '') || extractCode(product?.slug || '') || product?.slug || '';
    setProductCode(initialCode);

    const vName = selectedVariant?.name || '';
    setVariantName(vName);

    if (product?.name) {
      const fullTitle = vName ? `${product.name} (${vName})` : product.name;
      setProductTitle(fullTitle);
    } else {
      setProductTitle('');
    }

    setQuantity(1);
    setDeliveryDate(minDeliveryDate);
    setErrorMessage('');
    setSuccessData(null);
  }, [isOpen, product, selectedVariant, minDeliveryDate]);

  // Debounced auto-fetch product title when user changes Product Code
  useEffect(() => {
    if (!isOpen || !productCode.trim()) return;

    // If title already matches current code and product, no need to re-fetch immediately
    if (product?.name && productCode === (product.code || extractCode(product.name))) return;

    const handler = setTimeout(async () => {
      try {
        setIsLookingUp(true);
        const res = await fetch(`/api/custom-orders/lookup-product?code=${encodeURIComponent(productCode.trim())}&variant=${encodeURIComponent(variantName)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProductTitle(json.data.title || json.data.name);
          setErrorMessage('');
        }
      } catch (err) {
        // Silent catch for auto-lookup
      } finally {
        setIsLookingUp(false);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [productCode, variantName, isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerPhone.trim()) {
      setErrorMessage('Please provide a valid contact phone number.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please provide your complete delivery address.');
      return;
    }

    if (!deliveryDate) {
      setErrorMessage('Please select a preferred date of delivery.');
      return;
    }

    if (isBeforeMinDeliveryDate(deliveryDate, 10)) {
      setErrorMessage('Delivery date must be at least 10 days in advance for fresh handcrafted preparation.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?._id,
          productCode: productCode.trim(),
          productTitle: productTitle.trim() || productCode.trim(),
          variantName: variantName.trim(),
          quantity: Math.max(1, quantity),
          customerName: customerName.trim() || 'Valued Customer',
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          address: address.trim(),
          size: size.trim(),
          preferredColor: preferredColor.trim(),
          deliveryDate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit custom order request');
      }

      setSuccessData({ inquiryId: data.data.inquiryId });
    } catch (err: any) {
      setErrorMessage(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#0B3B24] via-[#134633] to-[#1C563F] text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Bespoke Made to Order
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white pr-8">
            Request Custom Floral Order
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Pricing on request. Our artisans will handcraft your design and send you a custom quote.
          </p>

          {/* Product Preview Card in Header */}
          {(product?.image || productTitle || productCode) && (
            <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/20 shrink-0 border border-white/20">
                <Image
                  src={product?.image || DEFAULT_FLORAL_PLACEHOLDER}
                  alt={productTitle || 'Product Preview'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs uppercase tracking-wider font-extrabold text-amber-300">
                  {productCode ? `Code: ${productCode}` : 'Custom Item'}
                </div>
                <div className="text-sm font-bold text-white truncate mt-0.5">
                  {productTitle || 'Custom Floral Arrangement'}
                </div>
                {variantName && (
                  <div className="text-[11px] text-emerald-200">
                    Option: {variantName}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        {successData ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0B3B24] flex items-center justify-center mx-auto border-2 border-emerald-300 animate-in zoom-in-95">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0B3B24]">
                Inquiry Received
              </span>
              <h3 className="text-2xl font-extrabold text-stone-900">
                Thank You for Your Order!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Your custom floral order reference is{' '}
                <strong className="text-[#0B3B24] font-black text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {successData.inquiryId}
                </strong>
                . Our team will review your specifications and contact you shortly via phone/WhatsApp with final confirmation and delivery coordination.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-amber-100 text-left space-y-2 text-xs text-stone-700">
              <div className="flex items-center gap-2 font-bold text-[#0B3B24]">
                <PackageCheck className="w-4 h-4 text-[#0B3B24]" />
                Next Steps:
              </div>
              <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                <li>We verify fresh flower sourcing & harvest schedules for your delivery date.</li>
                <li>You will receive a tailored quote and payment link.</li>
                <li>Your order will be handcrafted fresh and shipped with expedited cold-chain transit.</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-sm tracking-wide transition-colors cursor-pointer"
            >
              Done & Return to Store
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[calc(85vh-200px)] overflow-y-auto">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Row 1: Product Code & Auto-Fetched Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Product Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CG27, RP85"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24] uppercase tracking-wider"
                  />
                  {isLookingUp && (
                    <Loader2 className="w-3.5 h-3.5 text-[#0B3B24] animate-spin absolute right-3 top-3" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Product Title {isLookingUp ? '(Fetching...)' : '(Auto-Fetched / Editable)'}
                </label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder={isLookingUp ? 'Fetching product title...' : 'Enter or confirm product title'}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24] truncate"
                />
              </div>
            </div>

            {/* Row 2: Quantity & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Quantity <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-center py-2 text-xs font-bold text-stone-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 234-5678"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Delivery Address */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Full Delivery Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, Apt / Suite, City, State, ZIP Code"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24] resize-none"
                />
              </div>
            </div>

            {/* Row 5: Size & Preferred Color (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Size / Length <span className="text-stone-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 5 ft, Double strand, Large"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Preferred Color / Flowers <span className="text-stone-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={preferredColor}
                  onChange={(e) => setPreferredColor(e.target.value)}
                  placeholder="e.g. Red & Gold, Fresh Jasmine, Pink"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                />
              </div>
            </div>

            {/* Row 6: Delivery Date with 10-Day Lock-in Notice */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Date of Delivery <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  min={minDeliveryDate}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:border-[#0B3B24] focus:ring-1 focus:ring-[#0B3B24]"
                />
              </div>

              {/* 10-Day Advance Policy Banner */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mandatory 10-Day Preparation Period</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Earliest selectable delivery is{' '}
                  <strong className="font-bold underline">{formatReadableDate(minDeliveryDate)}</strong> to guarantee fresh Indian botanical harvest and artisanal weaving.
                </p>
                <p className="text-amber-900 font-medium pt-0.5">
                  Need it urgently within 10 days? Call our Hotline at{' '}
                  <a href="tel:+19093793678" className="font-bold text-[#0B3B24] underline hover:text-[#134633]">
                    +1 909-379-3678
                  </a>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Flower2 className="w-4 h-4" />
                    <span>Submit Custom Order</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
