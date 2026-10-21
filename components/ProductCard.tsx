'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Heart, Check, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

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
  description?: string;
  image: string;
  mrp: number;
  price: number;
  discount: number;
  quantity: number;
  isTaxable?: boolean;
  taxCode?: string;
  gst?: number;
  category?: string;
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
}

export default function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  isWishlisted,
  onToggleWishlist,
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

  return (
    <article className="group h-full flex flex-col bg-white rounded-xl sm:rounded-2xl border border-stone-200/90 hover:border-pink-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(237,35,83,0.12)] transition-all duration-300 hover:-translate-y-0.5 justify-between relative">
      {/* 1. Top Image Container with Floating Buttons (theindianflowers.com authentic mobile layout) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF6F0] p-1.5 sm:p-2.5">
        <Link
          href={`/product/${product._id}`}
          onClick={openProduct}
          className="block w-full h-full rounded-lg overflow-hidden relative"
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
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 rounded-md bg-stone-900/85 backdrop-blur-xs px-2 py-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            Sold out
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 rounded-md bg-[#ed2353] px-2 py-0.5 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-white shadow-xs">
            {discount}% OFF
          </span>
        ) : null}

        {/* Top-Right: Circular White Wishlist Button (♡) */}
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
          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 flex h-7.5 w-7.5 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white/95 hover:bg-white text-stone-600 hover:text-[#ed2353] shadow-[0_2px_6px_rgba(0,0,0,0.1)] border border-stone-100/90 backdrop-blur-xs transition-all hover:scale-110 active:scale-95 cursor-pointer"
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
              isFavorite ? 'fill-[#ed2353] text-[#ed2353]' : 'text-stone-600 hover:text-[#ed2353]'
            }`}
          />
        </button>

        {/* Bottom-Left: Signature Vivid Pink Square Add to Cart Button (🛒) */}
        <button
          type="button"
          onClick={handleCartButtonClick}
          disabled={outOfStock || isAdding}
          className={`absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg shadow-[0_2px_8px_rgba(237,35,83,0.35)] transition-all duration-200 active:scale-90 cursor-pointer ${
            outOfStock
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : justAdded
              ? 'bg-emerald-600 text-white scale-105'
              : 'bg-[#ed2353] hover:bg-[#d81b60] text-white hover:scale-105'
          }`}
          aria-label={`Add ${product.name} to cart`}
          title={hasVariants ? 'Choose options' : 'Add to cart'}
        >
          {justAdded ? (
            <Check className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.8]" />
          ) : (
            <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.2]" />
          )}
        </button>
      </div>

      {/* 2. Content Body Area (Center-aligned matching theindianflowers.com) */}
      <div className="flex flex-1 flex-col px-2.5 py-3 sm:px-3 sm:py-3.5 justify-between text-center">
        <div>
          {/* Product Title (Pink / Rose Semibold font, Centered) */}
          <Link href={`/product/${product._id}`} onClick={openProduct} className="block group/title">
            <h3 className="text-[12.5px] sm:text-[14px] font-semibold text-[#ed2353] hover:text-[#b7153f] transition-colors leading-[1.3] line-clamp-2 min-h-[33px] sm:min-h-[37px] text-center">
              {product.name}
            </h3>
          </Link>

          {/* Product Category (Muted gray, Centered) */}
          <div className="mt-1 text-[11px] sm:text-[12px] text-stone-400 sm:text-stone-500 font-normal truncate max-w-full text-center">
            {product.category || 'Indian Wedding Garlands'}
          </div>

          {/* Product Price (Pink / Rose Bold font, Centered, with range support) */}
          <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap text-center">
            <span className="text-[13.5px] sm:text-[15.5px] font-bold text-[#ed2353] tabular-nums leading-none tracking-tight">
              {isPriceRange
                ? `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
                : formatCurrency(currentPrice)}
            </span>
            {originalPrice > currentPrice && (
              <span className="text-[10.5px] sm:text-[12px] text-stone-400 line-through font-normal tabular-nums">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Optional Inline Variant Selector (Triggered when user clicks cart icon on multi-variant product) */}
        {hasVariants && showVariants && (
          <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1.5 text-left animate-in fade-in duration-150">
            <div className="text-[10.5px] font-semibold text-stone-500 text-center">Select an option:</div>
            {product.variants!.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => handleAddToCart(v)}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-stone-800 transition-colors hover:border-[#ed2353] hover:bg-rose-50/50"
              >
                <span className="truncate pr-1">{v.name}</span>
                <span className="shrink-0 font-bold tabular-nums text-[#ed2353]">
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
