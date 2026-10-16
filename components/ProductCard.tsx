'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, ChevronDown, Check } from 'lucide-react';
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

  const hasVariants = product.variants && product.variants.length > 0;
  const originalPrice = hasVariants ? product.variants[0]?.mrp : product.mrp;
  const currentPrice = hasVariants ? product.variants[0]?.price : product.price;

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
      setTimeout(() => setJustAdded(false), 1500);
    } finally {
      setIsAdding(false);
      setShowVariants(false);
    }
  };

  const openProduct = (e?: React.MouseEvent) => {
    if (onProductClick) {
      e?.preventDefault();
      onProductClick(product);
    }
  };

  return (
    <article className="group h-full flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(11,59,36,0.08)] transition-all duration-300 hover:-translate-y-1 justify-between">
      {/* 1. Top Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF6F0]">
        <Link
          href={`/product/${product._id}`}
          onClick={openProduct}
          className="block w-full h-full"
        >
          <img
            src={
              imgError || !product.image
                ? DEFAULT_FLORAL_PLACEHOLDER
                : product.image
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </Link>

        {/* Rectangular Discount Badge (Top-Left) */}
        {outOfStock ? (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-stone-900/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
            Sold out
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-md bg-[#E13B62] px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
            {discount}% OFF
          </span>
        ) : null}

        {/* Circular Wishlist Button (Top-Right) */}
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
          className="absolute top-2.5 right-2.5 z-10 flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full bg-white/95 hover:bg-white text-gray-600 hover:text-[#C85A78] shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-stone-100 backdrop-blur-xs transition-all hover:scale-110 active:scale-95"
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-[#C85A78] text-[#C85A78]' : 'text-gray-600 hover:text-[#C85A78]'
            }`}
          />
        </button>
      </div>

      {/* 2. Content Body Area */}
      <div className="flex flex-1 flex-col p-3 sm:p-4 justify-between">
        <div>
          {/* Product Title */}
          <Link href={`/product/${product._id}`} onClick={openProduct} className="block">
            <h3 className="text-[13px] sm:text-[14.5px] font-semibold text-gray-900 leading-[1.35] line-clamp-2 min-h-[35px] sm:min-h-[39px] group-hover:text-[#0B3B24] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Price Row: Bold Tabular Price + Strikethrough Original Price */}
          <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[17px] sm:text-[19px] font-bold text-[#0B3B24] tabular-nums leading-none tracking-tight">
              {formatCurrency(currentPrice)}
            </span>
            {originalPrice > currentPrice && (
              <span className="text-[11.5px] sm:text-[13px] text-stone-400 line-through font-normal tabular-nums">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Action Button: Choose options ⌵ or Add to cart */}
        <div className="mt-3 pt-1">
          {hasVariants && showVariants ? (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-medium text-gray-500">Select option:</div>
              {product.variants!.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => handleAddToCart(v)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-900 transition-colors hover:border-[#0B3B24] hover:bg-emerald-50/40"
                >
                  <span className="truncate pr-2">{v.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-[#0B3B24]">
                    {formatCurrency(v.price)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (hasVariants) {
                  if (onProductClick) {
                    onProductClick(product);
                  } else {
                    setShowVariants(true);
                  }
                } else {
                  handleAddToCart();
                }
              }}
              disabled={isAdding || outOfStock}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-[12.5px] sm:text-[13px] tracking-wide transition-all duration-200 active:scale-[0.98] shadow-2xs group/btn disabled:opacity-50 ${
                hasVariants
                  ? 'border border-[#0B3B24]/20 bg-emerald-50/50 hover:bg-[#0B3B24] text-[#0B3B24] hover:text-white'
                  : 'bg-[#0B3B24] hover:bg-[#1C563F] text-white'
              }`}
            >
              <span>
                {outOfStock
                  ? 'Out of stock'
                  : justAdded
                  ? 'Added to cart'
                  : hasVariants
                  ? 'Choose options'
                  : 'Add to cart'}
              </span>
              {!outOfStock && (
                justAdded ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : hasVariants ? (
                  <ChevronDown className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-200 group-hover/btn:translate-y-0.5" />
                ) : (
                  <ShoppingBag className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:scale-110" />
                )
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
