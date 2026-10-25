'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';
import { Product } from '@/components/ProductCard';

export const OPEN_SHARE_EVENT = 'open-product-share';

/**
 * Global helper to trigger the Product Share Modal from any component or card
 */
export function openProductShareModal(product: Product) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(OPEN_SHARE_EVENT, { detail: { product } })
  );
}

export default function ProductShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }

    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ product: Product }>;
      if (customEvent.detail?.product) {
        setProduct(customEvent.detail.product);
        setIsOpen(true);
        setCopied(false);
      }
    };

    window.addEventListener(OPEN_SHARE_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_SHARE_EVENT, handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCopied(false);
  }, []);

  // Keyboard accessibility: ESC to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !product) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://indian-flowers.com';
  const shareUrl = `${origin}/product/${product._id}`;
  const shareTitle = `${product.name} — Indian-Flowers.com`;
  const shareText = `Order fresh ${product.name} online from Indian-Flowers.com! Authentic fresh Indian flowers & handcrafted temple garlands delivered across USA.`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        // AbortError is normal when user cancels the native share sheet
        if (err?.name !== 'AbortError') {
          console.warn('Native share error:', err);
        }
      }
    }
  };

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bg: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
      border: 'border-emerald-300',
      action: () => {
        const text = `${shareText}\n\n🛒 Order now: ${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      },
    },
    {
      name: 'Facebook',
      icon: ExternalLink,
      bg: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      border: 'border-blue-300',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=500'
        );
      },
    },
    {
      name: 'X (Twitter)',
      icon: Share2,
      bg: 'bg-black hover:bg-stone-800 text-white',
      border: 'border-stone-700',
      action: () => {
        const tweetText = `Order fresh ${product.name} online from Indian-Flowers.com! Delivered fresh across USA.`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=450'
        );
      },
    },
    {
      name: 'Email',
      icon: Mail,
      bg: 'bg-[#0B3B24] hover:bg-[#134633] text-white',
      border: 'border-emerald-800',
      action: () => {
        const subject = `Fresh Indian Flowers: ${product.name}`;
        const body = `Hi,\n\nI thought you might love this fresh floral item on Indian-Flowers.com:\n\n${product.name}\nPrice: ${formatCurrency(product.price)}\n\nOrder here: ${shareUrl}\n\nFresh flowers, wedding garlands, and pooja essentials delivered fresh across USA!`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-heading"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop Click Dismiss */}
      <div
        className="fixed inset-0 -z-10"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-stone-200 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col">
        {/* Header Bar */}
        <div className="relative px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF6F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-[#0B3B24] flex items-center justify-center shadow-2xs">
              <Share2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="share-modal-heading"
                className="text-sm sm:text-base font-bold text-stone-900 tracking-tight leading-tight"
              >
                Share This Product
              </h3>
              <p className="text-[11px] text-stone-500 font-normal">
                Share authentic Indian flowers with friends &amp; family
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-900 border border-stone-200/80 flex items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Product Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-stone-200/70 shrink-0">
              <img
                src={product.image || DEFAULT_FLORAL_PLACEHOLDER}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_FLORAL_PLACEHOLDER;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#C85A78] block truncate">
                {product.category || 'Fresh Blooms'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                {product.name}
              </h4>
              <p className="text-xs font-extrabold text-[#0B3B24] tabular-nums mt-0.5">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>

          {/* Social Channels Quick Buttons Grid */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
              Share via
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {shareChannels.map((ch) => {
                const IconComp = ch.icon;
                return (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={ch.action}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer ${ch.bg}`}
                    title={`Share on ${ch.name}`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Click Copy Link Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
              Or copy product link
            </label>
            <div className="flex items-center gap-1.5 p-1 rounded-xl border border-stone-200 bg-stone-50/70 focus-within:border-[#0B3B24] focus-within:ring-2 focus-within:ring-[#0B3B24]/10 transition-all">
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Product URL to share"
                className="flex-1 bg-transparent px-3 text-xs text-stone-700 outline-none select-all truncate font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-xs transition-all duration-200 active:scale-95 shrink-0 cursor-pointer shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B3B24] hover:bg-[#134633] text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Web Share Trigger (Mobile / Supported Browsers) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More sharing options...</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#FAF6F0] border-t border-stone-100 text-center text-[10.5px] text-stone-500">
          Fresh Indian Flowers &bull; Nationwide Overnight Delivery Across USA
        </div>
      </div>
    </div>
  );
}
