'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Heart,
  Share2,
  Truck,
  CheckCircle2,
  MessageCircle,
  Leaf,
  ShieldCheck,
  Check,
  Clock,
  ChevronRight,
  PackageCheck,
  Sparkles,
  Minus,
  Plus,
  ZoomIn,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_FLORAL_PLACEHOLDER } from '@/lib/placeholderImage';
import { openProductShareModal } from '@/components/ProductShareModal';
import ProductCard, { Product, ProductVariant } from '@/components/ProductCard';
import ProductDescriptionRenderer from './ProductDescriptionRenderer';

export interface ProductDetailProps {
  product: Product;
  onAddToCart: (variant?: ProductVariant, quantity?: number) => void;
  onShare?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  loading?: boolean;
  relatedProducts?: Product[];
  onRelatedProductAddToCart?: (product: Product, variant?: ProductVariant) => void;
  onRelatedProductClick?: (product: Product) => void;
}

export default function ProductDetail({
  product,
  onAddToCart,
  onShare,
  isWishlisted: propIsWishlisted,
  onToggleWishlist,
  loading = false,
  relatedProducts = [],
  onRelatedProductAddToCart,
  onRelatedProductClick,
}: ProductDetailProps) {
  // Variant selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Internal wishlist state for self-contained resilience & instant UI response
  const [localWishlisted, setLocalWishlisted] = useState<boolean>(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState<boolean>(false);

  // Active accordion tab for product care & details
  const [activeTab, setActiveTab] = useState<'details' | 'freshness' | 'delivery' | 'pooja'>('details');

  // Handle ESC key to dismiss lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageLightboxOpen) {
        setIsImageLightboxOpen(false);
      }
    };
    if (isImageLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isImageLightboxOpen]);

  // Check wishlist status from props or localStorage
  useEffect(() => {
    if (propIsWishlisted !== undefined) {
      setLocalWishlisted(propIsWishlisted);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('if_wishlist') || localStorage.getItem('wishlist');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setLocalWishlisted(parsed.some((item: any) => item._id === product._id));
            return;
          }
        }
        setLocalWishlisted(false);
      } catch {
        setLocalWishlisted(false);
      }
    }
  }, [product._id, propIsWishlisted]);

  // Listen to global wishlist-updated events to stay in sync
  useEffect(() => {
    const handleWishlistUpdate = () => {
      try {
        const stored = localStorage.getItem('if_wishlist') || localStorage.getItem('wishlist');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setLocalWishlisted(parsed.some((item: any) => item._id === product._id));
            return;
          }
        }
        setLocalWishlisted(false);
      } catch {}
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [product._id]);

  // Active calculations
  const activeVariant = selectedVariant || (product.variants?.[0]);
  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const displayMrp = activeVariant ? activeVariant.mrp : product.mrp;
  const displayDiscount = activeVariant
    ? activeVariant.mrp > activeVariant.price
      ? Math.round(((activeVariant.mrp - activeVariant.price) / activeVariant.mrp) * 100)
      : 0
    : product.discount;
  const savingsAmount = displayMrp > displayPrice ? displayMrp - displayPrice : 0;
  const activeStock = activeVariant ? activeVariant.quantity : product.quantity;
  const isOutOfStock = activeStock <= 0;

  // Toggle Wishlist Handler
  const handleWishlistClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    // Call parent handler if supplied
    if (onToggleWishlist) {
      onToggleWishlist(product);
    } else if (typeof window !== 'undefined') {
      // Fallback standalone local storage management
      try {
        const currentRaw = localStorage.getItem('if_wishlist') || localStorage.getItem('wishlist');
        let currentList: any[] = [];
        if (currentRaw) {
          try {
            currentList = JSON.parse(currentRaw);
          } catch {
            currentList = [];
          }
        }
        const exists = currentList.some((p: any) => p._id === product._id);
        let nextList: any[];
        if (exists) {
          nextList = currentList.filter((p: any) => p._id !== product._id);
        } else {
          nextList = [...currentList, product];
        }
        localStorage.setItem('if_wishlist', JSON.stringify(nextList));
        localStorage.setItem('wishlist', JSON.stringify(nextList));
        window.dispatchEvent(new Event('wishlist-updated'));
      } catch (err) {
        console.error('Failed to toggle wishlist in localStorage:', err);
      }
    }

    const nextState = !localWishlisted;
    setLocalWishlisted(nextState);
    setWishlistToast(nextState ? 'Saved to your Wishlist!' : 'Removed from Wishlist');
    setTimeout(() => {
      setWishlistToast(null);
    }, 2800);
  };

  // Add to Cart Handler
  const handleAddToCart = () => {
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    try {
      onAddToCart(selectedVariant, quantity);
      setAddedNotice(true);
      setTimeout(() => {
        setAddedNotice(false);
        setIsAdding(false);
      }, 1500);
    } catch {
      setIsAdding(false);
    }
  };

  // Share Handler
  const handleShareClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (onShare) {
      onShare();
      return;
    }
    openProductShareModal(product);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-gray-900 font-jakarta selection:bg-emerald-100 selection:text-emerald-900 pb-20 md:pb-12">
      {/* 1. TOP BREADCRUMB NAVIGATION */}
      <div className="bg-white border-b border-stone-200/80 sticky top-0 md:static z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-xs font-medium text-stone-500 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link
              href="/"
              className="hover:text-[#0B3B24] transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 mx-1.5 shrink-0" />
            <Link
              href="/#products-section"
              className="hover:text-[#0B3B24] transition-colors shrink-0"
            >
              Fresh Flowers
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 mx-1.5 shrink-0" />
                <Link
                  href={`/#products-section?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-[#0B3B24] transition-colors shrink-0"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 mx-1.5 shrink-0" />
            <span className="text-stone-900 font-semibold truncate max-w-[180px] sm:max-w-xs shrink-0">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* TOAST FEEDBACK NOTIFICATION */}
      {wishlistToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-slideIn">
          <div className="bg-[#0B3B24] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-emerald-700/60">
            <Heart className={`w-4 h-4 ${localWishlisted ? 'text-[#ed2353] fill-[#ed2353]' : 'text-stone-300'}`} />
            <span>{wishlistToast}</span>
            <button
              onClick={() => {
                setWishlistToast(null);
                window.dispatchEvent(new Event('open-wishlist'));
              }}
              className="ml-2 underline text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              View Wishlist
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN HERO PRODUCT SHOWCASE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT: IMAGE SHOWCASE & TRUST CARDS (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Main Product Image Container */}
            <div
              onClick={() => setIsImageLightboxOpen(true)}
              className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-stone-200/90 shadow-[0_4px_24px_rgba(11,59,36,0.06)] group cursor-pointer"
              title="Click or tap to enlarge image"
            >
              {/* Top Badges */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 items-start">
                {isOutOfStock ? (
                  <span className="rounded-full bg-stone-900/90 backdrop-blur-xs px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                    Sold Out
                  </span>
                ) : displayDiscount > 0 ? (
                  <span className="rounded-full bg-[#ed2353] px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                    {displayDiscount}% OFF
                  </span>
                ) : null}

                <span className="rounded-full bg-white/95 backdrop-blur-xs border border-emerald-200/80 text-emerald-900 px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-xs">
                  <Leaf className="w-3 h-3 text-emerald-600" />
                  <span>Harvested & Strung Fresh</span>
                </span>
              </div>

              {/* Top-Right Floating Wishlist & Share Quick Buttons */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col gap-2 items-center">
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer ${
                    localWishlisted
                      ? 'bg-rose-50 text-[#ed2353] border border-rose-200 scale-105'
                      : 'bg-white/95 text-stone-700 hover:text-[#ed2353] border border-stone-200/80 hover:bg-white'
                  }`}
                  aria-label={localWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={localWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform active:scale-75 ${
                      localWishlisted ? 'fill-[#ed2353] text-[#ed2353]' : 'stroke-[2.2]'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleShareClick}
                  className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-emerald-700 flex items-center justify-center transition-all duration-200 shadow-md border border-stone-200/80 cursor-pointer"
                  aria-label="Share product"
                  title="Share product"
                >
                  <Share2 className="w-4.5 h-4.5 stroke-[2.2]" />
                </button>
              </div>

              {/* Enlarge Floating Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageLightboxOpen(true);
                }}
                className="absolute bottom-12 sm:bottom-14 right-3 sm:right-4 z-10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white text-[11px] sm:text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Tap to enlarge"
                aria-label="Enlarge product image"
              >
                <ZoomIn className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="text-[10.5px]">Enlarge</span>
              </button>

              {/* Product Image */}
              <img
                src={product.image || DEFAULT_FLORAL_PLACEHOLDER}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-104 select-none"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', DEFAULT_FLORAL_PLACEHOLDER);
                }}
              />

              {/* Bottom Assurance Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-900/75 via-stone-900/30 to-transparent p-4 text-white flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium drop-shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Authentic Indian Blooms in USA</span>
                </span>
                <span className="font-semibold text-emerald-300 text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Priority Overnight
                </span>
              </div>
            </div>

            {/* Hallmark 4-Card Cold-Chain Freshness Assurance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center mb-1.5">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-stone-900">Ice-Gel Packed</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">38°F–42°F Insulated</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-stone-900">FedEx Priority</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">By 10:30 AM in USA</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-stone-900">Puja Ready</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">Untainted & Pure</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-[11px] font-bold text-stone-900">100% Guarantee</h4>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">Fresh on Arrival</p>
              </div>
            </div>
          </div>

          {/* RIGHT: PRODUCT INFO & ORDER PANEL (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header: Category Eyebrow, Title & Reviews */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78]">
                  {product.category || 'Fresh Blooms'}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct US Cold-Chain</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#111827] leading-[1.2]">
                {product.name}
              </h1>
            </div>

            {/* Price Box with Luxury Ivory Texture */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-2.5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0B3B24] tabular-nums tracking-tight">
                  {formatCurrency(displayPrice)}
                </span>
                {displayMrp > displayPrice && (
                  <>
                    <span className="text-base sm:text-lg text-stone-400 line-through tabular-nums font-normal">
                      {formatCurrency(displayMrp)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#ed2353] border border-rose-200/80 text-xs font-bold uppercase tracking-wider">
                      Save {displayDiscount}% ({formatCurrency(savingsAmount)})
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All US Taxes Included</span>
                </div>

                <div>
                  {isOutOfStock ? (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      Temporarily Sold Out
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      In Stock for Upcoming Ceremonies
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 10-Day Advance Notice Delivery Callout */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-950">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-amber-900">
                  10-Day Advance Notice Required
                </h4>
                <p className="text-stone-700 leading-relaxed text-[12px]">
                  Fresh jasmine strands and handcrafted wedding garlands are picked and strung 24–48 hours prior to your event date. A minimum 10-day advance lead time is required for harvesting and reservation of cold-chain air cargo (FedEx / Southwest).
                </p>
              </div>
            </div>

            {/* Variants Selector (Size / Weight / Garland Length) */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-stone-900 text-[11px]">
                    Select Size / Option:
                  </span>
                  {activeVariant && (
                    <span className="font-semibold text-[#0B3B24] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                      Selected: {activeVariant.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = activeVariant?.name === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                          isSelected
                            ? 'border-[#0B3B24] bg-[#F4F8F4] ring-1.5 ring-[#0B3B24] shadow-xs'
                            : 'border-stone-200 bg-white hover:border-emerald-300 text-stone-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-stone-900 truncate">{v.name}</div>
                        <div className="text-xs font-semibold text-[#0B3B24] mt-1 tabular-nums">
                          {formatCurrency(v.price)}
                        </div>
                        {v.mrp > v.price && (
                          <div className="text-[10px] text-stone-400 line-through tabular-nums">
                            {formatCurrency(v.mrp)}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#0B3B24] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Price Calculation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-stone-900 text-[11px]">
                  Quantity:
                </span>
                <span className="text-stone-500">
                  Subtotal:{' '}
                  <strong className="text-stone-900 font-bold tabular-nums">
                    {formatCurrency(displayPrice * quantity)}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-stone-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 active:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-stone-700 font-bold cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={activeStock > 0 ? activeStock : 99}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    disabled={isOutOfStock}
                    className="w-14 h-10 text-center font-bold text-sm text-stone-900 border-x border-stone-200 focus:outline-hidden focus:bg-emerald-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock || (activeStock > 0 && quantity >= activeStock)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-stone-50 active:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-stone-700 font-bold cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  {quantity > 1 ? `${quantity} items ready to ship` : 'Single order pack'}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: Add to Cart, Wishlist, Share */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding || loading}
                className="w-full py-4 rounded-xl bg-[#0B3B24] hover:bg-[#134633] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer group"
              >
                {addedNotice ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <span>Added to Shopping Bag!</span>
                  </>
                ) : isAdding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding to Bag...</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Currently Out of Stock</span>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Add to Shopping Bag • {formatCurrency(displayPrice * quantity)}</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                {/* Wishlist Toggle Button */}
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    localWishlisted
                      ? 'border-rose-300 bg-rose-50/90 text-[#ed2353] shadow-2xs'
                      : 'border-stone-200 bg-white hover:border-rose-300 text-stone-700 hover:text-[#ed2353]'
                  }`}
                  aria-pressed={localWishlisted}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform active:scale-75 ${
                      localWishlisted ? 'fill-[#ed2353] text-[#ed2353]' : 'stroke-[2.2]'
                    }`}
                  />
                  <span>{localWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShareClick}
                  className="py-3 px-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 text-stone-700 hover:text-[#0B3B24] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                  <span>Share Product</span>
                </button>
              </div>

              {/* WhatsApp Florist Concierge CTA */}
              <a
                href={`https://wa.me/19093793678?text=${encodeURIComponent(
                  `Namaste! I would like to inquire about ordering ${product.name} (${formatCurrency(
                    displayPrice
                  )}) for my upcoming event.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Custom Garland Order? Chat on WhatsApp</span>
              </a>
            </div>

            {/* 3. TABS / ACCORDION FOR PRODUCT STORY, CARE & DELIVERY */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'details'
                      ? 'border-[#0B3B24] text-[#0B3B24]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  About This Flower
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('freshness')}
                  className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'freshness'
                      ? 'border-[#0B3B24] text-[#0B3B24]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Freshness & Storage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('delivery')}
                  className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'delivery'
                      ? 'border-[#0B3B24] text-[#0B3B24]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  US Delivery Rules
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pooja')}
                  className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'pooja'
                      ? 'border-[#0B3B24] text-[#0B3B24]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Pooja Suitability
                </button>
              </div>

              <div className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <ProductDescriptionRenderer
                      content={product.descriptionHtml || product.description}
                    />
                    <p className="text-stone-500 text-xs pt-2 border-t border-stone-100">
                      Category: <strong className="text-stone-800">{product.category || 'Fresh Floral Essentials'}</strong>
                    </p>
                  </div>
                )}

                {activeTab === 'freshness' && (
                  <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                    <h5 className="font-bold text-emerald-900 text-xs">How to Keep Blooms Fragrant Until Muhurtham:</h5>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-950">
                      <li>Upon arrival, inspect the box and keep the flowers inside the moisture-seal liner.</li>
                      <li>Store immediately in your refrigerator crisper drawer at 40°F–45°F.</li>
                      <li>For Jasmine (Mallipoo), keep wrapped in fresh banana leaves or lightly damp paper towel.</li>
                      <li>Never place fresh flowers in the freezer or under direct air-conditioning vents.</li>
                    </ul>
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                    <h5 className="font-bold text-stone-900 text-xs">Nationwide USA Delivery Details:</h5>
                    <p className="text-xs text-stone-600">
                      We ship across all 50 US States via FedEx Priority Overnight. Flights depart from cold cargo hubs Mon–Thu to arrive fresh Tue–Fri before 10:30 AM local time. Saturday delivery available in select metropolitan zip codes.
                    </p>
                  </div>
                )}

                {activeTab === 'pooja' && (
                  <div className="space-y-2 bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
                    <h5 className="font-bold text-amber-950 text-xs">Auspicious Occasion Guidance:</h5>
                    <p className="text-xs text-amber-900">
                      Untainted, sacred blooms prepared following Vedic ritual purity. Perfect for Gruhapravesam, Satyanarayan Pooja, Ganesh Chaturthi, Varalakshmi Vratham, Hindu Wedding Ceremonies (Jai Mala / Varmala), and Temple deity adornment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. RELATED PRODUCTS ("FREQUENTLY PAIRED WITH") */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-stone-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#C85A78]">
                  Complete Your Ceremony
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B3B24] tracking-tight mt-0.5">
                  Frequently Paired With This Item
                </h3>
              </div>
              <Link
                href="/#products-section"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group shrink-0"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.slice(0, 4).map((relProduct) => (
                <ProductCard
                  key={relProduct._id}
                  product={relProduct}
                  onAddToCart={(prod, v) => {
                    if (onRelatedProductAddToCart) {
                      onRelatedProductAddToCart(prod, v);
                    } else {
                      onAddToCart(v, 1);
                    }
                  }}
                  onProductClick={onRelatedProductClick}
                  onShare={() => openProductShareModal(relProduct)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. MOBILE FLOATING STICKY ACTION BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-4 py-2.5 sm:hidden flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
            <img
              src={product.image || DEFAULT_FLORAL_PLACEHOLDER}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate max-w-[130px]">
              {product.name}
            </p>
            <p className="text-xs font-extrabold text-[#0B3B24] tabular-nums">
              {formatCurrency(displayPrice)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleWishlistClick}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              localWishlisted
                ? 'border-rose-300 bg-rose-50 text-[#ed2353]'
                : 'border-stone-200 bg-white text-stone-700'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${localWishlisted ? 'fill-[#ed2353]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="py-2.5 px-4 rounded-xl bg-[#0B3B24] active:bg-[#134633] text-white font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>
        </div>
      </div>

      {/* High-Resolution Full-Screen Image Lightbox Modal */}
      {isImageLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image preview"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsImageLightboxOpen(false)}
        >
          {/* Top Bar with Title & Close Button */}
          <div
            className="absolute top-3 inset-x-3 sm:top-5 sm:inset-x-8 flex items-center justify-between text-white z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-[75%]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                {product.category || 'Fresh Floral Garland'}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate drop-shadow-sm font-jakarta">
                {product.name}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsImageLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer shadow-lg"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Centered Large Image */}
          <div
            className="relative max-w-full max-h-[82vh] flex flex-col items-center justify-center z-10 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.image || DEFAULT_FLORAL_PLACEHOLDER}
              alt={product.name}
              className="max-w-[94vw] max-h-[76vh] sm:max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-200"
            />
            <div className="flex items-center gap-2 mt-3 text-white/80 text-[11px] font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tap anywhere outside or click ✕ to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
