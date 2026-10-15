'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  Truck,
  Leaf,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';
import { Product, ProductVariant } from '@/components/ProductCard';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export default function ProductQuickViewModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
}: ProductQuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Initialize or reset selected variant and quantity when product changes
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setQuantity(1);
      setImgError(false);
    }
  }, [product]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const activeVariant = selectedVariant || (hasVariants ? product.variants![0] : undefined);

  const activePrice = activeVariant ? activeVariant.price : product.price;
  const activeMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const activeDiscount =
    activeMrp > activePrice
      ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
      : product.discount || 0;

  const savingsAmount = activeMrp > activePrice ? activeMrp - activePrice : 0;
  const isOutOfStock = product.quantity <= 0;

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      onAddToCart(product, activeVariant, quantity);
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* ======================================================== */}
      {/* MOBILE VIEW (< md): Modern E-commerce Bottom Sheet Drawer */}
      {/* ======================================================== */}
      <div className="md:hidden w-full rounded-t-[28px] bg-white shadow-[0_-12px_48px_rgba(0,0,0,0.28)] max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-stone-200/80">
        {/* Drag Handle & Header */}
        <div className="relative pt-2.5 pb-2 px-4 flex items-center justify-between border-b border-gray-100 shrink-0 bg-stone-50/70">
          <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto" />
          <button
            onClick={onClose}
            className="absolute right-3 top-2.5 w-8 h-8 rounded-full bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/80 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Product Summary Header Card: Thumbnail + Info */}
          <div className="flex gap-3.5 items-start">
            {/* Product Thumbnail with Discount Badge */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 aspect-square rounded-2xl overflow-hidden bg-[#FAF6F0] border border-stone-200/80 shadow-xs shrink-0">
              {activeDiscount > 0 && (
                <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-[#C83B47] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white shadow-xs">
                  {activeDiscount}% OFF
                </span>
              )}
              <img
                src={imgError || !product.image ? DEFAULT_FLORAL_PLACEHOLDER : product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Title, Category & Price */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A78] truncate">
                  {product.category || 'Fresh Blooms'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 shrink-0">
                  <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Fresh</span>
                </span>
              </div>

              <h2 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 font-jakarta">
                {product.name}
              </h2>

              {/* Price & Savings */}
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-xl font-extrabold text-gray-900 tabular-nums font-jakarta">
                  {formatCurrency(activePrice)}
                </span>
                {activeMrp > activePrice && (
                  <span className="text-xs text-gray-400 line-through tabular-nums">
                    {formatCurrency(activeMrp)}
                  </span>
                )}
                {savingsAmount > 0 && (
                  <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Save {formatCurrency(savingsAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Size / Variant Options */}
          {hasVariants && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Select Size / Option:
                </span>
                {activeVariant && (
                  <span className="text-[#0B3B24] font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {activeVariant.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {product.variants!.map((variant) => {
                  const isSelected = activeVariant?.name === variant.name;
                  return (
                    <button
                      key={variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#0B3B24] bg-[#F4F8F4] text-[#0B3B24] ring-1 ring-[#0B3B24] shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-1.5">
                        <span className="block text-xs font-semibold truncate">
                          {variant.name}
                        </span>
                        <span
                          className={`block text-[11px] tabular-nums mt-0.5 font-semibold ${
                            isSelected ? 'text-[#0B3B24]' : 'text-gray-500'
                          }`}
                        >
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-[#0B3B24] border-[#0B3B24] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact Trust Features Strip */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#FAF7F2] border border-stone-200/70 text-center">
            <div className="flex flex-col items-center">
              <Leaf className="w-3.5 h-3.5 text-[#0B3B24] mb-0.5" />
              <span className="text-[10px] font-semibold text-gray-800">100% Fresh</span>
              <span className="text-[9px] text-gray-500">Altar Ready</span>
            </div>
            <div className="flex flex-col items-center border-x border-stone-200/60 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700 mb-0.5" />
              <span className="text-[10px] font-semibold text-gray-800">Cold-Pack</span>
              <span className="text-[9px] text-gray-500">Ice-Insulated</span>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-3.5 h-3.5 text-amber-700 mb-0.5" />
              <span className="text-[10px] font-semibold text-gray-800">Nationwide</span>
              <span className="text-[9px] text-gray-500">Across USA</span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Area on Mobile */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
          <div className="flex items-center gap-2">
            {/* Quantity Stepper */}
            <div className="h-11 flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shrink-0">
              <button
                type="button"
                onClick={handleDecreaseQty}
                disabled={quantity <= 1}
                className="w-7 h-full rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center text-xs font-bold text-gray-900 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncreaseQty}
                className="w-7 h-full rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Primary CTA Button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding || isOutOfStock}
              className="h-11 flex-1 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-xs tracking-[0.01em] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>
                {isOutOfStock
                  ? 'Out of Stock'
                  : `Add to Bag • ${formatCurrency(activePrice * quantity)}`}
              </span>
            </button>

            {/* Wishlist Button */}
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(product)}
                className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                  isWishlisted
                    ? 'border-[#C85A78] bg-rose-50 text-[#C85A78]'
                    : 'border-gray-200 text-gray-600'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                aria-label="Toggle Wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isWishlisted ? 'fill-[#C85A78] text-[#C85A78]' : 'text-gray-600'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Subtle Trust Note */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Insulated cold ice-gel • 100% fresh delivery across USA</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP VIEW (md: and up): Spacious 2-Column Luxury Modal */}
      {/* ======================================================== */}
      <div className="hidden md:flex relative bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] lg:max-h-[640px] flex-row overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-gray-500 hover:text-gray-900 border border-gray-200/80 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3B24]"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Left Column: Image & Badges */}
        <div className="w-5/12 bg-[#FAF7F2] p-6 lg:p-7 flex flex-col justify-between items-center relative border-r border-stone-200/60 shrink-0">
          <div className="w-full my-auto flex items-center justify-center">
            <div className="relative w-64 h-64 lg:w-72 lg:h-72 rounded-2xl overflow-hidden shadow-sm bg-white border border-stone-200/80 group">
              {activeDiscount > 0 && (
                <span className="absolute top-3 left-3 z-10 rounded-md bg-[#C83B47] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                  {activeDiscount}% OFF
                </span>
              )}
              <img
                src={imgError || !product.image ? DEFAULT_FLORAL_PLACEHOLDER : product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
                onError={() => setImgError(true)}
              />
            </div>
          </div>

          {/* Badges Strip */}
          <div className="w-full pt-3 mt-3 border-t border-stone-200/60 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center mb-1 border border-emerald-100">
                <Leaf className="w-3.5 h-3.5 text-[#0B3B24]" />
              </div>
              <span className="text-[10.5px] font-semibold text-gray-800 leading-tight">100% Fresh</span>
              <span className="text-[9.5px] text-gray-500">Altar Ready</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-1 border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <span className="text-[10.5px] font-semibold text-gray-800 leading-tight">Cold-Pack</span>
              <span className="text-[9.5px] text-gray-500">Ice-Insulated</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1 border border-amber-100">
                <Truck className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <span className="text-[10.5px] font-semibold text-gray-800 leading-tight">Nationwide</span>
              <span className="text-[9.5px] text-gray-500">Across USA</span>
            </div>
          </div>
        </div>

        {/* Right Column: Content & Controls */}
        <div className="w-7/12 p-6 lg:p-8 overflow-y-auto flex flex-col justify-between bg-white space-y-4">
          <div className="space-y-3">
            {/* Category & Title */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C85A78]">
                  {product.category || 'Fresh Indian Flowers'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Fresh Harvest</span>
                </span>
              </div>

              <h2 id="modal-product-title" className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug tracking-[-0.03em] font-jakarta">
                {product.name}
              </h2>
            </div>

            {/* Price & Savings */}
            <div className="flex flex-wrap items-baseline gap-3 py-2.5 border-y border-gray-100">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums font-jakarta leading-none">
                {formatCurrency(activePrice)}
              </span>
              {activeMrp > activePrice && (
                <span className="text-sm sm:text-base text-gray-400 line-through tabular-nums font-normal">
                  {formatCurrency(activeMrp)}
                </span>
              )}
              {savingsAmount > 0 && (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  Save {formatCurrency(savingsAmount)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              {product.description ||
                'Delicate, fragrant fresh blossoms strung and handled with ritual purity for temple altars, home daily pooja, and auspicious ceremonies. Delivered fresh across the USA.'}
            </p>

            {/* Variant / Size Options */}
            {hasVariants && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                    Select Option / Size:
                  </span>
                  {activeVariant && (
                    <span className="text-[#0B3B24] font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {activeVariant.name}
                    </span>
                  )}
                </div>

                <div className={`grid gap-2 ${product.variants!.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {product.variants!.map((variant) => {
                    const isSelected = activeVariant?.name === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#0B3B24] bg-[#F4F8F4] text-[#0B3B24] shadow-xs ring-1 ring-[#0B3B24]'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-800 hover:bg-gray-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="block text-xs sm:text-sm font-semibold truncate">
                            {variant.name}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-[#0B3B24] border-[#0B3B24] text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                        <span className={`block text-[11px] sm:text-xs tabular-nums mt-1 font-semibold ${isSelected ? 'text-[#0B3B24]' : 'text-gray-500'}`}>
                          {formatCurrency(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Purchase Controls & Bottom Action Area */}
          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Quantity Counter */}
              <div className="h-11 flex items-center border border-gray-200 rounded-xl bg-gray-50/90 p-1 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  disabled={quantity <= 1}
                  className="w-8 h-full rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition-all active:scale-95"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs sm:text-sm font-bold text-gray-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQty}
                  className="w-8 h-full rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || isOutOfStock}
                className="h-11 flex-1 px-4 sm:px-6 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-xs sm:text-sm tracking-[0.01em] flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(11,59,36,0.18)] hover:shadow-[0_4px_16px_rgba(11,59,36,0.28)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : `Add to Bag • ${formatCurrency(activePrice * quantity)}`}
                </span>
              </button>

              {/* Wishlist Button */}
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                    isWishlisted
                      ? 'border-[#C85A78] bg-rose-50 text-[#C85A78] shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-[#C85A78] hover:bg-gray-50'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  aria-label="Toggle Wishlist"
                >
                  <Heart
                    className={`w-4.5 h-4.5 transition-colors ${
                      isWishlisted ? 'fill-[#C85A78] text-[#C85A78]' : 'text-gray-600'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Subtle Trust Assurance */}
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] sm:text-[11px] text-gray-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cold ice-gel packed • Guaranteed 100% fresh delivery across USA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
