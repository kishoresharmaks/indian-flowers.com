'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Share2, Check, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';
import { openProductShareModal } from './ProductShareModal';

export interface ProductVariant {
  _id?: string;
  name: string;
  mrp: number;
  price: number;
  quantity: number;
  discount?: number;
}

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  wpId?: number;
  description?: string;
  descriptionHtml?: string;
  shortDescription?: string;
  image: string;
  images?: string[];
  mrp: number;
  price: number;
  discount: number;
  quantity: number;
  isTaxable?: boolean;
  taxCode?: string;
  gst?: number;
  category?: string;
  categorySlug?: string;
  subcategory?: string;
  rating?: number;
  reviewsCount?: number;
  variants?: ProductVariant[];
  createdAt?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onProductClick?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  loading?: boolean;
  onShare?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  isWishlisted,
  onToggleWishlist,
  onShare,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [localFavorite, setLocalFavorite] = useState(false);
  const isFavorite = isWishlisted !== undefined ? isWishlisted : localFavorite;
  const [showVariants, setShowVariants] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product.image]);

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const originalPrice = hasVariants ? product.variants![0]?.mrp : product.mrp;
  const currentPrice = hasVariants ? product.variants![0]?.price : product.price;

  // Calculate Price Range across variants if available
  let minPrice = currentPrice;
  let maxPrice = currentPrice;
  if (hasVariants && product.variants && product.variants.length > 1) {
    const validPrices = product.variants
      .map((v) => v.price)
      .filter((p) => typeof p === 'number' && p > 0);
    if (validPrices.length > 0) {
      minPrice = Math.min(...validPrices);
      maxPrice = Math.max(...validPrices);
    }
  }
  const isPriceRange = maxPrice > minPrice;

  // Compact price formatting for ranges to preserve neat mobile single-line alignment
  const formatCompactPrice = (val: number): string => {
    if (typeof val !== 'number' || isNaN(val)) return '$0';
    if (val % 1 === 0) {
      return `$${val.toLocaleString('en-US')}`;
    }
    return formatCurrency(val);
  };

  const discount =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : product.discount || 0;

  const outOfStock = product.quantity <= 0;

  const handleAddToCart = async (variant?: ProductVariant) => {
    setIsAdding(true);
    try {
      onAddToCart(product, variant);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } finally {
      setIsAdding(false);
      setShowVariants(false);
    }
  };

  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || isAdding) return;

    if (hasVariants) {
      if (onProductClick) {
        onProductClick(product);
      } else {
        setShowVariants((prev) => !prev);
      }
    } else {
      handleAddToCart();
    }
  };

  const openProduct = (e?: React.MouseEvent) => {
    if (onProductClick) {
      e?.preventDefault();
      onProductClick(product);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShare) {
      onShare(product);
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://indian-flowers.com';
    const shareUrl = `${origin}/product/${product._id}`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${product.name} — Indian-Flowers.com`,
          text: `Order fresh ${product.name} online from Indian-Flowers.com! Fresh Indian Flowers & Garlands delivered across USA.`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    openProductShareModal(product);
  };

  return (
    <article className="group h-full flex flex-col bg-white rounded-xl sm:rounded-2xl border border-stone-200/80 hover:border-emerald-300/80 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(11,59,36,0.08)] transition-all duration-300 hover:-translate-y-0.5 justify-between relative">
      {/* 1. Top Image Container: Full-bleed clean header with subtle rounded top */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100 rounded-t-xl sm:rounded-t-2xl">
        <Link
          href={`/product/${product.slug || product._id}`}
          onClick={openProduct}
          className="block w-full h-full relative"
        >
          <img
            src={
              imgError || !product.image
                ? DEFAULT_FLORAL_PLACEHOLDER
                : product.image
            }
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-106"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Top-Left: Out of Stock or Discount Badge */}
        {outOfStock ? (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 rounded-full bg-stone-900/85 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            Sold out
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 rounded-full bg-[#ed2353] px-2 sm:px-2.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-white shadow-xs">
            {discount}% OFF
          </span>
        ) : null}

        {/* Top-Right: Clean Wishlist + Share Vertical Action Stack */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex flex-col gap-1 items-center">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) {
                onToggleWishlist(product);
              } else {
                setLocalFavorite(!localFavorite);
              }
            }}
            className={`p-1.5 flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-90 cursor-pointer ${
              isFavorite
                ? 'text-[#ed2353] drop-shadow-[0_2px_4px_rgba(237,35,83,0.35)]'
                : 'text-stone-700 hover:text-[#ed2353] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]'
            }`}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            title={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isFavorite}
          >
            <Heart
              className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-colors ${
                isFavorite ? 'fill-[#ed2353] text-[#ed2353]' : 'stroke-[2.2]'
              }`}
            />
          </button>

          {/* Share Button (Under the Wishlist Button) */}
          <button
            type="button"
            onClick={handleShareClick}
            className="p-1.5 flex items-center justify-center text-stone-700 hover:text-[#0B3B24] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] transition-all duration-200 hover:scale-115 active:scale-90 cursor-pointer"
            aria-label={`Share ${product.name}`}
            title="Share this product"
          >
            <Share2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2. Content Body Area */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3 justify-between">
        <div>
          {/* Product Category Eyebrow */}
          <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium tracking-wide uppercase truncate max-w-full text-left mb-0.5">
            {product.category || 'Indian Wedding Garlands'}
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.slug || product._id}`} onClick={openProduct} className="block group/title">
            <h3 className="text-[12.5px] sm:text-[14px] font-semibold text-stone-900 group-hover/title:text-[#0B3B24] transition-colors leading-[1.3] line-clamp-2 min-h-[33px] sm:min-h-[37px] text-left">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* 3. Bottom Action Row: Price on Left, Cart Button on Right (Always Single-Line on Mobile!) */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
          {/* Price Stack */}
          <div className="flex flex-col text-left min-w-0 flex-1">
            {isPriceRange ? (
              <span className="text-[12.5px] xs:text-[13px] sm:text-[15px] font-bold text-[#0B3B24] tabular-nums tracking-tight whitespace-nowrap">
                {formatCompactPrice(minPrice)} – {formatCompactPrice(maxPrice)}
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-[13px] xs:text-[13.5px] sm:text-[15px] font-bold text-[#0B3B24] tabular-nums tracking-tight whitespace-nowrap">
                  {formatCurrency(currentPrice)}
                </span>
                {originalPrice > currentPrice && (
                  <span className="text-[10px] sm:text-[11px] text-stone-400 line-through font-normal tabular-nums whitespace-nowrap -mt-0.5">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cart Button: Clean circular pill with ShoppingCart icon, anchored at right */}
          <button
            type="button"
            onClick={handleCartButtonClick}
            disabled={outOfStock || isAdding}
            className={`flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full transition-all duration-200 hover:scale-108 active:scale-95 cursor-pointer shrink-0 shadow-xs ${
              outOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white scale-105 shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                : 'bg-[#0B3B24] hover:bg-[#1C563F] text-white shadow-[0_2px_6px_rgba(11,59,36,0.2)] hover:shadow-[0_4px_12px_rgba(11,59,36,0.3)]'
            }`}
            aria-label={`Add ${product.name} to cart`}
            title={hasVariants ? 'Choose options' : 'Add to cart'}
          >
            {justAdded ? (
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.8]" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.2]" />
            )}
          </button>
        </div>

        {/* Optional Inline Variant Selector (Triggered when user clicks cart icon on multi-variant product) */}
        {hasVariants && showVariants && (
          <div className="mt-2 pt-2 border-t border-stone-100 space-y-1.5 text-left animate-in fade-in duration-150">
            <div className="text-[10px] font-semibold text-stone-500 text-left">Select an option:</div>
            {product.variants!.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => handleAddToCart(v)}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-stone-800 transition-colors hover:border-[#0B3B24] hover:bg-emerald-50/50"
              >
                <span className="truncate pr-1">{v.name}</span>
                <span className="shrink-0 font-bold tabular-nums text-[#0B3B24]">
                  {formatCurrency(v.price)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
