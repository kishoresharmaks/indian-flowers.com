'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Trash2, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Product, ProductVariant } from '@/components/ProductCard';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  cartProductIds?: string[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onClearWishlist?: () => void;
  onProductClick?: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  items,
  cartProductIds = [],
  onRemoveFromWishlist,
  onAddToCart,
  onClearWishlist,
  onProductClick,
}: WishlistDrawerProps) {
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});

  useEffect(() => {
    setRecentlyAddedIds((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (!cartProductIds.includes(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [cartProductIds]);

  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    const chosenVariant =
      variant ||
      selectedVariants[product._id] ||
      (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    onAddToCart(product, chosenVariant);
    setRecentlyAddedIds((prev) => ({ ...prev, [product._id]: true }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full-Screen Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* True Full-Height Edge-to-Edge Slide-Over Panel */}
      <aside
        className={`fixed inset-y-0 right-0 h-full w-full max-w-md sm:max-w-[450px] bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.22)] z-[1000] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist Drawer"
      >
        {/* Pinned Top Header */}
        <div className="border-b border-stone-200/90 px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#C85A78] border border-rose-200/60 shadow-2xs">
              <Heart className="w-4 h-4 fill-current stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                  My Wishlist
                </h2>
                {items.length > 0 && (
                  <span className="text-[11px] font-extrabold bg-[#C85A78] text-white px-2 py-0.5 rounded-full shadow-2xs">
                    {items.length}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Close Wishlist"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Saved Ceremonial Notice Strip */}
        <div className="bg-gradient-to-r from-rose-50/60 via-[#FFF9FA] to-rose-50/60 border-b border-rose-100/70 px-5 py-2 flex items-center gap-2 text-xs text-rose-950 shrink-0">
          <span className="text-sm">🌸</span>
          <span className="flex-1 text-[11px] font-medium leading-tight">
            Saved flowers and garlands for your upcoming sacred celebrations.
          </span>
        </div>

        {/* Scrollable Items List (Sleek Clean Scroll) */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3.5 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#C85A78] border border-rose-100 shadow-2xs">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-stone-500 max-w-xs leading-relaxed font-normal">
                  Tap the heart icon on any wedding garlands, fragrant jasmine strings, or pooja leaves to save them for your ceremony.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Browse Fresh Flowers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            items.map((product) => {
              const activeVariant =
                selectedVariants[product._id] ||
                (product.variants && product.variants.length > 0
                  ? product.variants[0]
                  : undefined);
              const displayPrice = activeVariant ? activeVariant.price : product.price;

              return (
                <div
                  key={product._id}
                  className="p-3.5 rounded-2xl bg-stone-50/70 hover:bg-emerald-50/30 border border-stone-200/80 transition-all flex gap-3.5 shadow-2xs group"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onProductClick?.(product)}
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200/90 shadow-2xs ${
                      onProductClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A78] block">
                        {product.category || 'Fresh Floral'}
                      </span>
                      <h4
                        onClick={() => onProductClick?.(product)}
                        className={`text-xs sm:text-[13px] font-bold text-stone-900 leading-snug line-clamp-2 ${
                          onProductClick ? 'cursor-pointer hover:text-[#0B3B24]' : ''
                        }`}
                      >
                        {product.name}
                      </h4>

                      {/* Variant Selector / Details */}
                      {product.variants && product.variants.length > 1 ? (
                        <div className="py-1">
                          <span className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                            Select Variant:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {product.variants.map((v) => {
                              const isSelected = activeVariant?.name === v.name;
                              return (
                                <button
                                  key={v.name}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVariants((prev) => ({
                                      ...prev,
                                      [product._id]: v,
                                    }));
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0B3B24] text-white shadow-2xs'
                                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                                  }`}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : activeVariant ? (
                        <div className="py-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {activeVariant.name}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs sm:text-sm font-extrabold text-[#0B3B24] tabular-nums">
                        {formatCurrency(displayPrice)}
                      </p>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const isAdded =
                            Boolean(recentlyAddedIds[product._id]) ||
                            cartProductIds.includes(product._id);

                          return (
                            <button
                              onClick={() => handleAddToCart(product, activeVariant)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                                isAdded
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-[#0B3B24] hover:bg-[#134633] text-white'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-700" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Add to Bag</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => onRemoveFromWishlist(product._id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove from wishlist"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200/90 bg-white shrink-0 space-y-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-medium">Saved Items Total:</span>
              <span className="font-extrabold text-[#0B3B24] text-sm tabular-nums">
                {formatCurrency(
                  items.reduce((sum, p) => {
                    const active =
                      selectedVariants[p._id] ||
                      (p.variants && p.variants.length > 0 ? p.variants[0] : undefined);
                    return sum + (active ? active.price : p.price);
                  }, 0)
                )}
              </span>
            </div>

            {onClearWishlist && (
              <button
                onClick={onClearWishlist}
                className="w-full py-2 text-center text-xs text-stone-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
              >
                Clear All Wishlist Items
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
