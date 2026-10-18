'use client';

import React, { useState } from 'react';
import { ShoppingBag, Heart, Share2, Truck, CheckCircle2, MessageCircle, Star, Leaf, ShieldCheck, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';

interface ProductVariant {
  _id?: string;
  name: string;
  mrp: number;
  price: number;
  quantity: number;
  discount?: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  discount: number;
  quantity: number;
  gst: number;
  category: string;
  variants?: ProductVariant[];
  createdAt?: string;
}

interface ProductDetailProps {
  product: Product;
  onAddToCart: (variant?: ProductVariant, quantity?: number) => void;
  onShare: () => void;
  loading?: boolean;
}

export default function ProductDetail({
  product,
  onAddToCart,
  onShare,
  loading = false,
}: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const activeVariant = selectedVariant || (product.variants?.[0]);
  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const displayMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const displayDiscount = activeVariant
    ? activeVariant.mrp > activeVariant.price
      ? Math.round(((activeVariant.mrp - activeVariant.price) / activeVariant.mrp) * 100)
      : 0
    : product.discount;
  const activeStock = activeVariant ? activeVariant.quantity : product.quantity;
  const isOutOfStock = activeStock <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      onAddToCart(selectedVariant, quantity);
      setQuantity(1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-brand-50 border border-border shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    DEFAULT_FLORAL_PLACEHOLDER
                  );
                }}
              />
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-white text-center flex flex-col items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-600 mb-1.5" />
                <p className="text-xs font-semibold text-text">100% Fresh</p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-white text-center flex flex-col items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-700 mb-1.5" />
                <p className="text-xs font-semibold text-text">Verified Quality</p>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-white text-center flex flex-col items-center justify-center">
                <Truck className="w-5 h-5 text-amber-600 mb-1.5" />
                <p className="text-xs font-semibold text-text">Express USA Delivery</p>
              </div>
            </div>
          </div>

          {/* Right: Sticky Info Panel */}
          <div className="lg:sticky lg:top-8">
            <div className="space-y-6">
              {/* Category and Ratings */}
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-medium text-brand-700">
                  {product.category || 'General'}
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[-0.03em] text-[#111827] leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-normal text-text-muted">(4.9/5 • 248 reviews)</span>
                </div>
              </div>

              {/* Price Block */}
              <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-amber-100/70 space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="product-price text-3xl sm:text-4xl font-bold text-brand-900">
                    {formatCurrency(displayPrice)}
                  </span>
                  {displayMrp > displayPrice && (
                    <>
                      <span className="text-base text-text-muted line-through tabular-nums font-normal">
                        {formatCurrency(displayMrp)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-medium">
                        Save {displayDiscount}%
                      </span>
                    </>
                  )}
                </div>

                <div className="text-xs text-text-muted space-y-1.5 font-normal">
                  <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Freshness Guaranteed on Arrival</span>
                  </p>
                  {isOutOfStock ? (
                    <p className="font-medium text-rose-700">Out of Stock</p>
                  ) : (
                    <p className="font-normal text-emerald-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>In Stock ({activeStock} units available)</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-text uppercase tracking-wider">About this product</h3>
                <p className="text-sm sm:text-base text-text-muted leading-relaxed font-normal">{product.description}</p>
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-text uppercase tracking-wider">
                    Select Weight / Size
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedVariant?.name === v.name
                            ? 'border-brand-700 bg-brand-50/70 text-brand-900 font-medium'
                            : 'border-border hover:border-brand-300 font-normal text-text'
                        }`}
                      >
                        <div className="text-sm font-medium">{v.name}</div>
                        <div className="text-xs text-text-muted mt-0.5 tabular-nums">{formatCurrency(v.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-text uppercase tracking-wider">Quantity</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-border bg-white hover:bg-brand-50 flex items-center justify-center font-medium"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-center font-medium"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-border bg-white hover:bg-brand-50 flex items-center justify-center font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || loading}
                  className="w-full py-3.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ShoppingBag className="w-4 h-4" /> {isOutOfStock ? 'Out of Stock' : 'Add to Shopping Bag'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`py-2.5 rounded-xl border font-medium text-xs uppercase tracking-wider transition-all ${
                      isWishlisted
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-border bg-white text-text hover:border-red-300'
                    }`}
                  >
                    <Heart className={`w-4 h-4 mx-auto ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={onShare}
                    className="py-2.5 rounded-xl border border-border bg-white hover:border-green-300 text-text font-medium text-xs uppercase tracking-wider transition-all"
                  >
                    <Share2 className="w-4 h-4 mx-auto text-green-600" />
                  </button>
                </div>
              </div>

              {/* Trust & Support */}
              <div className="space-y-2 pt-4 border-t border-border">
                <a
                  href={`https://wa.me/919578784431?text=Hi, I'm interested in ${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-emerald-200/80 transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Support
                </a>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1 font-normal">
                    <Truck className="w-4 h-4 text-emerald-600" /> Free Shipping on Orders Over $50
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
