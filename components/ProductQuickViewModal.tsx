'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Star,
  Check,
  Plus,
  Minus,
  Truck,
  Leaf,
  ShieldCheck,
  Flower2,
  Heart,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
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
  isWishlisted,
  onToggleWishlist,
}: ProductQuickViewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Initialize or reset selected variant and quantity when product changes
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setQuantity(1);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const activeVariant = selectedVariant || (hasVariants ? product.variants![0] : undefined);

  const activePrice = activeVariant ? activeVariant.price : product.price;
  const activeMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const activeDiscount =
    activeMrp > activePrice
      ? Math.round(((activeMrp - activePrice) / activeMrp) * 100)
      : product.discount || 0;

  const rating = product.rating || 4.8;
  const reviewsCount = product.reviewsCount || 85;

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAdd = () => {
    setIsAdding(true);
    try {
      onAddToCart(product, activeVariant, quantity);
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Dialog Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white border border-gray-200/80 shadow-md flex items-center justify-center text-gray-700 hover:text-black transition-all hover:scale-105"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Imagery & Trust Highlights */}
        <div className="md:w-1/2 bg-[#FAF6F0] p-6 sm:p-8 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-amber-100/60 shrink-0">
          {/* Category Eyebrow Badge */}
          <div className="w-full flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#0B3B24] bg-white border border-amber-200/50 shadow-2xs">
              <Flower2 className="w-3.5 h-3.5 text-[#0B3B24]" />
              <span>{product.category || 'Fresh Floral'}</span>
            </span>
          </div>

          {/* Centered High-Res Image */}
          <div className="w-full my-4 flex items-center justify-center">
            <div className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-sm bg-white border border-amber-100/80 group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/40 text-center">
            <div className="flex flex-col items-center">
              <Leaf className="w-4 h-4 text-emerald-700 mb-1" />
              <span className="text-[10px] font-medium text-gray-700 leading-tight">
                100% Fresh
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Truck className="w-4 h-4 text-amber-700 mb-1" />
              <span className="text-[10px] font-medium text-gray-700 leading-tight">
                Nationwide USA
              </span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-blue-700 mb-1" />
              <span className="text-[10px] font-medium text-gray-700 leading-tight">
                Cold-Pack Safe
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details, Variant Picker & Actions */}
        <div className="md:w-1/2 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between space-y-5 bg-white">
          <div className="space-y-4">
            {/* Title & Ratings */}
            <div className="space-y-1.5 pr-8 sm:pr-10">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800 block">
                Direct From Trusted Growers
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl text-gray-900 leading-snug font-bold tracking-[-0.03em]">
                {product.name}
              </h2>

              {/* Star Rating */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-800">{rating}</span>
                <span className="text-xs text-gray-400 font-normal">
                  ({reviewsCount} customer reviews)
                </span>
              </div>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-1 border-y border-gray-100 py-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(activePrice)}
              </span>
              {activeMrp > activePrice && (
                <span className="text-sm sm:text-base text-gray-400 line-through tabular-nums font-normal">
                  {formatCurrency(activeMrp)}
                </span>
              )}
              {activeDiscount > 0 && (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full">
                  {activeDiscount}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              {product.description ||
                'Authentic Indian fresh flowers and handcrafted garlands delivered fresh across the United States.'}
            </p>

            {/* Interactive Variant Picker */}
            {hasVariants && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800 uppercase tracking-wider text-[11px]">
                    Select Option / Size:
                  </span>
                  {activeVariant && (
                    <span className="text-emerald-700 font-medium text-xs">
                      {activeVariant.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.variants!.map((variant) => {
                    const isSelected = activeVariant?.name === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'border-[#0B3B24] bg-emerald-50/70 text-[#0B3B24] ring-2 ring-[#0B3B24]/20 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block text-xs sm:text-sm font-semibold truncate">
                            {variant.name}
                          </span>
                          <span
                            className={`block text-[11px] tabular-nums font-medium ${
                              isSelected ? 'text-[#0B3B24]' : 'text-gray-500'
                            }`}
                          >
                            {formatCurrency(variant.price)}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0B3B24] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector & Primary CTA Button */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/70 p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="w-9 text-center text-xs sm:text-sm font-semibold text-gray-900 tabular-nums">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncreaseQty}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add To Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || product.quantity <= 0}
                className="flex-1 py-3 px-5 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow active:scale-98 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.quantity <= 0
                    ? 'Out of Stock'
                    : `Add to Shopping Bag — ${formatCurrency(activePrice * quantity)}`}
                </span>
              </button>

              {/* Wishlist Toggle Button */}
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-all shrink-0 ${
                    isWishlisted
                      ? 'border-[#C85A78] bg-rose-50 text-[#C85A78]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-[#C85A78]'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  aria-label="Toggle Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-500 text-center font-normal">
              Temperature-controlled cold-chain packaging guarantees freshness across the US.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
