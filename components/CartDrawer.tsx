'use client';

import React from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Plane,
  Truck,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { IDeliveryMode } from '@/lib/delivery';
import { formatCurrency } from '@/lib/currency';

interface CartItem {
  product: {
    _id: string;
    name: string;
    image: string;
    price?: number;
    gst: number;
  };
  selectedVariant?: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, variantName: string | undefined, quantity: number) => void;
  onRemove: (productId: string, variantName?: string) => void;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  deliveryModes?: IDeliveryMode[];
  selectedDeliveryMode?: IDeliveryMode | null;
  onSelectDeliveryMode?: (mode: IDeliveryMode) => void;
  shippingFee?: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  onCheckout,
  items,
  onUpdateQuantity,
  onRemove,
  subtotal,
  gstTotal,
  grandTotal,
  deliveryModes = [],
  selectedDeliveryMode = null,
  onSelectDeliveryMode,
  shippingFee = 0,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Full-Screen Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* True Full-Height Edge-to-Edge Slide-Over Panel */}
      <div
        className={`fixed inset-y-0 right-0 h-full w-full max-w-md sm:max-w-[450px] bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.22)] z-[1000] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
      >
        {/* Pinned Top Header */}
        <div className="border-b border-stone-200/90 px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0B3B24] flex items-center justify-center border border-emerald-200/70 shadow-2xs">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                Shopping Bag
              </h2>
              {itemCount > 0 && (
                <span className="text-[11px] font-extrabold bg-[#0B3B24] text-white px-2 py-0.5 rounded-full shadow-2xs">
                  {itemCount}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Cold-Chain Freshness Assurance Strip */}
        <div className="bg-gradient-to-r from-emerald-50 via-[#F4F8F4] to-emerald-50 border-b border-emerald-100/80 px-5 py-2 flex items-center gap-2 text-xs text-emerald-950 shrink-0">
          <span className="text-sm">🌿</span>
          <span className="flex-1 text-[11px] font-medium leading-tight">
            <strong>Fresh Cold-Chain:</strong> Delivered in insulated ice-pack packaging across USA.
          </span>
        </div>

        {/* Scrollable Body: Cart Items + Delivery Modes (Sleek Clean Scroll) */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0B3B24]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Your bag is empty</h3>
                <p className="text-stone-500 text-xs max-w-xs leading-relaxed font-normal">
                  Explore our handcrafted wedding garlands, jasmine strands, and sacred pooja flowers.
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0B3B24] hover:bg-[#134633] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Explore Fresh Flowers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Items List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.product._id}-${item.selectedVariant?.name || 'default'}`}
                    className="p-3.5 rounded-2xl bg-stone-50/70 hover:bg-emerald-50/30 border border-stone-200/80 transition-all flex gap-3.5 shadow-2xs group"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200/90 shadow-2xs">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug line-clamp-2">
                          {item.product.name}
                        </h4>
                        {item.selectedVariant?.name && (
                          <div className="pt-1">
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              {item.selectedVariant.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xs sm:text-sm font-extrabold text-[#0B3B24] tabular-nums">
                          {formatCurrency(item.selectedVariant?.price ?? item.product.price ?? 0)}
                        </p>

                        {/* Quantity Controls & Delete */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-stone-200/90 rounded-lg p-0.5 shadow-2xs">
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product._id,
                                  item.selectedVariant?.name,
                                  item.quantity - 1
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors active:scale-90 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-stone-900 w-6 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product._id,
                                  item.selectedVariant?.name,
                                  item.quantity + 1
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors active:scale-90 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              onRemove(item.product._id, item.selectedVariant?.name)
                            }
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            aria-label="Remove item"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Modes Selector */}
              {deliveryModes && deliveryModes.length > 0 && (
                <div className="pt-3 border-t border-stone-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0B3B24]" />
                      <span>Delivery Options</span>
                    </span>
                    {selectedDeliveryMode && (
                      <span className="text-[10px] font-bold text-[#0B3B24] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                        {selectedDeliveryMode.id === 'fedex-shipping'
                          ? 'By ZIP'
                          : selectedDeliveryMode.price > 0
                          ? formatCurrency(selectedDeliveryMode.price)
                          : 'Free Pickup'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {deliveryModes
                      .filter((m) => m.active !== false)
                      .map((mode) => {
                        const isSelected = selectedDeliveryMode?.id === mode.id;
                        const isPickup = mode.type === 'pickup';
                        const isFedEx = mode.id === 'fedex-shipping';

                        return (
                          <label
                            key={mode.id}
                            onClick={() => onSelectDeliveryMode?.(mode)}
                            className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#0B3B24] bg-emerald-50/70 ring-1 ring-[#0B3B24] shadow-2xs'
                                : 'border-stone-200/80 hover:border-stone-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="radio"
                                name="cartDeliveryMode"
                                checked={isSelected}
                                onChange={() => onSelectDeliveryMode?.(mode)}
                                className="w-4 h-4 text-[#0B3B24] focus:ring-[#0B3B24] accent-[#0B3B24] shrink-0 cursor-pointer"
                              />

                              <div className="min-w-0">
                                <span className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                                  {isPickup ? (
                                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  ) : mode.name.toLowerCase().includes('air') ||
                                    mode.name.toLowerCase().includes('flight') ||
                                    mode.name.toLowerCase().includes('south') ? (
                                    <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                  ) : (
                                    <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                  <span className="truncate">{mode.name}</span>
                                </span>

                                {mode.description && (
                                  <p
                                    className={`text-[10px] truncate leading-tight mt-0.5 ${
                                      isPickup ? 'text-amber-700 font-medium' : 'text-stone-500'
                                    }`}
                                  >
                                    {mode.description}
                                  </p>
                                )}
                                {isFedEx && (
                                  <p className="text-[9.5px] text-purple-700 font-semibold truncate mt-0.5">
                                    Rates calculated dynamically at checkout via live FedEx API.
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-extrabold text-[#0B3B24] shrink-0 tabular-nums ml-2">
                              {isFedEx ? (
                                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  Live ZIP
                                </span>
                              ) : mode.price > 0 ? (
                                formatCurrency(mode.price)
                              ) : (
                                'FREE'
                              )}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Bottom Footer (Permanently Visible Without Scrolling) */}
        {items.length > 0 && (
          <div className="border-t border-stone-200/90 px-5 py-4 bg-white shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] space-y-3 z-20">
            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-stone-500">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span className="tabular-nums font-semibold text-stone-900">{formatCurrency(subtotal)}</span>
              </div>

              {selectedDeliveryMode && (
                <div className="flex justify-between items-center text-stone-500">
                  <span className="truncate pr-2">
                    Shipping ({selectedDeliveryMode.name}):
                  </span>
                  <span className="tabular-nums font-bold text-[#0B3B24] shrink-0">
                    {selectedDeliveryMode.id === 'fedex-shipping'
                      ? 'Calculated at checkout'
                      : selectedDeliveryMode.price > 0
                      ? formatCurrency(selectedDeliveryMode.price)
                      : '$0.00 (Free Pickup)'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200/80">
                <div>
                  <span className="text-sm font-extrabold text-stone-900">Total (USD)</span>
                  {selectedDeliveryMode?.id === 'fedex-shipping' && (
                    <span className="text-[10px] text-purple-700 font-medium block">
                      + FedEx fee calculated at checkout
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-xl font-extrabold text-[#0B3B24] tabular-nums">
                  {formatCurrency(
                    selectedDeliveryMode?.id === 'fedex-shipping'
                      ? subtotal + gstTotal
                      : grandTotal
                  )}
                </span>
              </div>
            </div>

            {/* Proceed to Checkout CTA (Always Clickable) */}
            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0B3B24] hover:bg-[#134633] active:bg-[#072718] text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Trust Assurance */}
            <div className="text-center pt-0.5">
              <p className="text-[10px] text-stone-400 font-medium flex items-center justify-center gap-1.5">
                <span>🔒 256-Bit Encrypted</span>
                <span>&bull;</span>
                <span>🌿 100% Fresh Arrival Guarantee</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
