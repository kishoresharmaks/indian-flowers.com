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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed right-0 top-0 h-screen w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Wishlist Drawer"
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-4 sm:p-5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-[#C85A78]">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#134633]">My Wishlist</h2>
              <span className="text-xs text-gray-500 font-normal">
                {items.length} {items.length === 1 ? 'item saved' : 'items saved'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close Wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-[#C85A78] border border-rose-100">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-gray-900">Your Wishlist is Empty</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed font-normal">
                  Tap the heart icon on any garlands, jasmine strands, or pooja essentials to save them for your upcoming ceremonies.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
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
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-gray-100 bg-white hover:border-emerald-100 transition-all shadow-2xs group"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => onProductClick?.(product)}
                    className={`w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 ${
                      onProductClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C85A78] block">
                      {product.category || 'Fresh Floral'}
                    </span>
                    <h4
                      onClick={() => onProductClick?.(product)}
                      className={`text-xs sm:text-sm font-semibold text-gray-900 truncate ${
                        onProductClick ? 'cursor-pointer hover:text-[#0B3B24]' : ''
                      }`}
                    >
                      {product.name}
                    </h4>

                    {/* Variant Selector / Details */}
                    {product.variants && product.variants.length > 1 ? (
                      <div className="py-1">
                        <span className="text-[10px] font-medium text-gray-500 block mb-1">
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
                                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                                  isSelected
                                    ? 'bg-[#0B3B24] text-white shadow-2xs font-semibold'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/60'
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
                        <span className="inline-flex items-center text-[10px] font-medium text-[#134633] bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/50">
                          {activeVariant.name}
                        </span>
                      </div>
                    ) : null}

                    <div className="text-xs font-bold text-[#0B3B24] tabular-nums">
                      {formatCurrency(displayPrice)}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {(() => {
                        const isAdded =
                          Boolean(recentlyAddedIds[product._id]) ||
                          cartProductIds.includes(product._id);

                        return (
                          <button
                            onClick={() => handleAddToCart(product, activeVariant)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                              isAdded
                                ? 'bg-emerald-800 text-white shadow-xs hover:bg-emerald-900'
                                : 'bg-[#0B3B24] hover:bg-[#134633] text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-200" />
                                <span>Added to Cart</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3 h-3" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => onRemoveFromWishlist(product._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from wishlist"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Saved Items Total:</span>
              <strong className="font-semibold text-gray-900 tabular-nums">
                {formatCurrency(
                  items.reduce((sum, p) => {
                    const active =
                      selectedVariants[p._id] ||
                      (p.variants && p.variants.length > 0 ? p.variants[0] : undefined);
                    return sum + (active ? active.price : p.price);
                  }, 0)
                )}
              </strong>
            </div>

            {onClearWishlist && (
              <button
                onClick={onClearWishlist}
                className="w-full py-2 text-center text-xs text-gray-500 hover:text-rose-600 font-medium transition-colors"
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
