'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Star, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

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
  const [localFavorite, setLocalFavorite] = useState(false);
  const isFavorite = isWishlisted !== undefined ? isWishlisted : localFavorite;
  const [showVariants, setShowVariants] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;
  const originalPrice = hasVariants ? product.variants[0]?.mrp : product.mrp;
  const currentPrice = hasVariants ? product.variants[0]?.price : product.price;

  const discount =
    originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : product.discount || 0;

  const rating = product.rating || 4.8;
  const reviewsCount = product.reviewsCount || 85;
  const outOfStock = product.quantity <= 0;

  const handleAddToCart = async (variant?: ProductVariant) => {
    setIsAdding(true);
    try {
      onAddToCart(product, variant);
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
    <article className="group h-full flex flex-col bg-white rounded-2xl border border-[#E3E7E1] overflow-hidden shadow-[0_1px_2px_rgba(23,56,43,0.04)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(23,56,43,0.08)]">
      <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-[#FAF6F0]">
        <Link
          href={`/product/${product._id}`}
          onClick={openProduct}
          className="block w-full h-full"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
            loading="lazy"
          />
        </Link>

        {outOfStock ? (
          <span className="absolute top-2.5 left-2.5 z-[1] rounded-full bg-[#202722]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            Sold out
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-2.5 left-2.5 z-[1] rounded-full bg-[#A52C3B] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            {discount}% off
          </span>
        ) : null}

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
          className="absolute top-2 right-2 z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-400 shadow-[0_1px_4px_rgba(23,56,43,0.08)] transition-all hover:scale-105 hover:text-[#C85A78]"
          aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-[#C85A78] text-[#C85A78]' : 'text-[#5F6861]'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/product/${product._id}`} onClick={openProduct} className="block">
          <h3 className="product-title text-[#111827] line-clamp-2 min-h-[2.5em] group-hover:text-[#0B3B24] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] sm:text-xs text-[#6B7280]">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span className="font-semibold tabular-nums text-[#111827]">{rating}</span>
          <span className="text-[#9CA3AF]">({reviewsCount})</span>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="product-price text-[15px] sm:text-[17px] leading-none text-[#111827]">
            {formatCurrency(currentPrice)}
          </span>
          {originalPrice > currentPrice && (
            <span className="text-[11px] sm:text-xs tabular-nums text-[#9CA3AF] line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {hasVariants && showVariants ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-[#5F6861]">Choose option</div>
              {product.variants!.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => handleAddToCart(v)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E3E7E1] bg-white px-2.5 py-2 text-left text-xs font-medium text-[#111827] transition-colors hover:border-[#0B3B24]"
                >
                  <span className="truncate pr-2">{v.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-[#0B3B24]">
                    {formatCurrency(v.price)}
                  </span>
                </button>
              ))}
            </div>
          ) : hasVariants ? (
            <button
              type="button"
              onClick={() => {
                if (onProductClick) {
                  onProductClick(product);
                } else {
                  setShowVariants(true);
                }
              }}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#C6E4D4] bg-[#F4F8F4] px-3 text-[13px] sm:text-sm font-semibold tracking-[0.02em] text-[#0B3B24] transition-colors hover:bg-[#EAF2EC] active:scale-[0.98]"
            >
              <span>Choose options</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAddToCart()}
              disabled={isAdding || outOfStock}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B3B24] px-3 text-[13px] sm:text-sm font-semibold tracking-[0.02em] text-white transition-colors hover:bg-[#134633] active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
              <span>{outOfStock ? 'Out of stock' : 'Add to cart'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
