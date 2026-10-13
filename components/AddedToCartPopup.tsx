'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Product, ProductVariant } from '@/components/ProductCard';

export interface AddedItemDetails {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface AddedToCartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  item: AddedItemDetails | null;
  cartSubtotal: number;
  cartItemCount: number;
  onViewCart: () => void;
  onCheckout: () => void;
}

export default function AddedToCartPopup({
  isOpen,
  onClose,
  item,
  cartSubtotal,
  cartItemCount,
  onViewCart,
  onCheckout,
}: AddedToCartPopupProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [isOpen, isPaused, onClose]);

  if (!isOpen || !item) return null;

  const unitPrice = item.variant ? item.variant.price : item.product.price;
  const lineTotal = unitPrice * item.quantity;

  return (
    <div
      className="fixed top-4 inset-x-3 sm:top-6 sm:right-6 sm:left-auto sm:inset-x-auto sm:w-[410px] z-50 transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5 p-4 sm:p-5 relative animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-300">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-semibold text-xs sm:text-sm text-gray-900">
              Added to Shopping Bag
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Summary Row */}
        <div className="py-3.5 flex items-center gap-3.5">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF6F0] border border-amber-100/70 shrink-0">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Variant Details */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate leading-snug">
              {item.product.name}
            </h4>

            {item.variant && (
              <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                {item.variant.name}
              </span>
            )}

            <div className="text-xs text-gray-600 flex items-center justify-between pt-0.5 font-normal">
              <span>
                Qty: <strong className="font-semibold text-gray-900">{item.quantity}</strong>
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {formatCurrency(lineTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Bag Subtotal Row */}
        <div className="pt-2.5 pb-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-normal">
            Bag Subtotal ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}):
          </span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {formatCurrency(cartSubtotal)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              onViewCart();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Bag</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onCheckout();
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-800 bg-gray-50/70 hover:bg-gray-100 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtle timer countdown progress bar */}
        {!isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden">
            <div className="h-full bg-[#0B3B24]/40 animate-[shrink_4.5s_linear_forwards]" />
          </div>
        )}
      </div>
    </div>
  );
}
