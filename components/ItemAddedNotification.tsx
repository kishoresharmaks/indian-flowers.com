'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, X, ArrowRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

export interface AddedItemDetail {
  product: {
    _id?: string;
    name: string;
    image?: string;
    price?: number;
  };
  variant?: {
    name: string;
    price: number;
  };
  quantity?: number;
}

export function dispatchItemAdded(detail: AddedItemDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('item-added-to-cart', { detail }));
}

interface ItemAddedNotificationProps {
  onViewCart?: () => void;
}

export default function ItemAddedNotification({ onViewCart }: ItemAddedNotificationProps) {
  const [item, setItem] = useState<AddedItemDetail | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const durationMs = 3200; // 3.2 seconds display time
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(durationMs);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsFadingOut(false);
      setItem(null);
    }, 280);
  };

  const handleViewCart = () => {
    handleDismiss();
    if (onViewCart) {
      onViewCart();
    } else {
      window.dispatchEvent(new Event('open-cart'));
    }
  };

  // Listen for the custom "item-added-to-cart" event
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AddedItemDetail>;
      if (customEvent.detail) {
        setItem(customEvent.detail);
        setIsFadingOut(false);
        setIsOpen(true);
        setProgress(100);
        remainingTimeRef.current = durationMs;
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener('item-added-to-cart', handleEvent);
    return () => window.removeEventListener('item-added-to-cart', handleEvent);
  }, []);

  // Timer and progress bar handling with pause/resume on hover
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = 40; // 40ms tick for smooth progress
    const step = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const left = Math.max(0, remainingTimeRef.current - elapsed);
      setProgress((left / durationMs) * 100);

      if (left <= 0) {
        handleDismiss();
      } else {
        timerRef.current = setTimeout(step, interval);
      }
    };

    timerRef.current = setTimeout(step, interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    // calculate remaining
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  if (!isOpen || !item) return null;

  const unitPrice = item.variant ? item.variant.price : item.product?.price || 0;
  const quantity = item.quantity || 1;
  const total = unitPrice * quantity;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-3.5 inset-x-3.5 sm:inset-x-auto sm:right-6 sm:top-5 sm:w-[380px] z-[100] transition-all duration-300 ease-out pointer-events-auto ${
        isFadingOut
          ? 'opacity-0 -translate-y-3 sm:translate-x-4 scale-95'
          : 'opacity-100 translate-y-0 sm:translate-x-0 scale-100'
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white border border-emerald-100/90 shadow-[0_16px_42px_rgba(11,59,36,0.18),0_2px_10px_rgba(0,0,0,0.06)] p-3.5 sm:p-4 ring-1 ring-black/5">
        {/* Top Header Row: Green Check Badge + "Item added to cart" + Close Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[2.8]" />
            </div>
            <span className="font-bold text-[13px] sm:text-sm text-gray-900 tracking-tight">
              Item added to cart
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Middle Product Details Row */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-3">
          {/* Floral Image Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FAF6F0] border border-amber-100 shrink-0 flex items-center justify-center">
            <img
              src={item.product?.image || DEFAULT_FLORAL_PLACEHOLDER}
              alt={item.product?.name || 'Fresh Indian flower item'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FLORAL_PLACEHOLDER;
              }}
            />
          </div>

          {/* Product Name, Variant, Qty & Price */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate leading-snug">
              {item.product?.name}
            </h4>

            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-gray-600">
              {item.variant && (
                <span className="inline-block bg-emerald-50 text-emerald-800 font-medium px-1.5 py-0.5 rounded border border-emerald-200/70 truncate max-w-[130px]">
                  {item.variant.name}
                </span>
              )}
              <span>Qty: <strong className="font-semibold text-gray-900">{quantity}</strong></span>
              {total > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="font-bold text-gray-900 tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick "View Cart" CTA Button */}
          <button
            type="button"
            onClick={handleViewCart}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#0B3B24] hover:text-white bg-[#EAF5EE] hover:bg-[#0B3B24] px-2.5 py-1.5 rounded-xl transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Cart</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Auto-dismiss Animated Progress Bar (Botanical Emerald) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/90 overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
