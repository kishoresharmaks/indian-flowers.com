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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer: 100dvh guarantees full visibility within dynamic mobile viewport */}
      <div
        className={`fixed right-0 top-0 h-[100dvh] max-h-[100dvh] w-full md:w-96 bg-white shadow-2xl z-[100] flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header (Always pinned at top) */}
        <div className="border-b border-border px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#111827]">
              Shopping Cart
            </h2>
            {itemCount > 0 && (
              <span className="text-[11px] font-bold bg-[#0B3B24] text-white px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ivory transition-colors text-text"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-text" />
          </button>
        </div>

        {/* Scrollable Body: Cart Items + Delivery Modes */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <ShoppingBag className="w-12 h-12 text-text-muted" />
              <div>
                <p className="text-text-muted text-sm font-normal">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="text-brand-700 text-sm font-medium hover:underline mt-2 inline-block cursor-pointer"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Items List */}
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={`${item.product._id}-${item.selectedVariant?.name || 'default'}`}
                    className="flex gap-3 pb-3 border-b border-border last:border-0"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-ivory shrink-0 border border-border/60"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-medium text-text truncate">
                        {item.product.name}
                      </h4>
                      {item.selectedVariant?.name && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200/60">
                            {item.selectedVariant.name}
                          </span>
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-semibold text-brand-900 tabular-nums">
                        {formatCurrency(item.selectedVariant?.price ?? item.product.price ?? 0)}
                      </p>

                      {/* Quantity & Delete Controls */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg p-0.5">
                          <button
                            onClick={() =>
                              onUpdateQuantity(
                                item.product._id,
                                item.selectedVariant?.name,
                                item.quantity - 1
                              )
                            }
                            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text hover:bg-white rounded transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-text w-5 text-center tabular-nums">
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
                            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text hover:bg-white rounded transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            onRemove(item.product._id, item.selectedVariant?.name)
                          }
                          className="ml-auto p-1 text-stone-400 hover:text-red-600 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Modes Selector (Streamlined & Compact) */}
              {deliveryModes && deliveryModes.length > 0 && (
                <div className="pt-2.5 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-brand-700" />
                      <span>Delivery Mode</span>
                    </span>
                    {selectedDeliveryMode && (
                      <span className="text-[10px] font-semibold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                        {selectedDeliveryMode.id === 'fedex-shipping'
                          ? 'Calculated by ZIP'
                          : selectedDeliveryMode.price > 0
                          ? formatCurrency(selectedDeliveryMode.price)
                          : 'Local Pickup'}
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
                            className={`flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-brand-700 bg-brand-50/60 ring-1 ring-brand-700'
                                : 'border-border hover:border-stone-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="radio"
                                name="cartDeliveryMode"
                                checked={isSelected}
                                onChange={() => onSelectDeliveryMode?.(mode)}
                                className="w-3.5 h-3.5 text-brand-700 focus:ring-brand-700 accent-brand-700 shrink-0 cursor-pointer"
                              />

                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
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
                                      isPickup ? 'text-amber-700 font-medium' : 'text-text-muted'
                                    }`}
                                  >
                                    {mode.description}
                                  </p>
                                )}
                                {isFedEx && (
                                  <p className="text-[9px] text-purple-700 font-medium truncate mt-0.5">
                                    Rates calculated dynamically at checkout once ZIP is entered.
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="text-xs font-bold text-brand-900 shrink-0 tabular-nums ml-2">
                              {isFedEx ? (
                                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  By ZIP
                                </span>
                              ) : mode.price > 0 ? (
                                formatCurrency(mode.price)
                              ) : (
                                '$0.00'
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
          <div className="border-t border-border px-4 py-3 sm:py-3.5 bg-white shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] space-y-2.5 z-20">
            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs font-normal">
              <div className="flex justify-between items-center text-text-muted">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span className="tabular-nums font-medium text-text">{formatCurrency(subtotal)}</span>
              </div>

              {selectedDeliveryMode && (
                <div className="flex justify-between items-center text-text-muted">
                  <span className="truncate pr-2">
                    Shipment ({selectedDeliveryMode.name}):
                  </span>
                  <span className="tabular-nums font-semibold text-brand-900 shrink-0">
                    {selectedDeliveryMode.id === 'fedex-shipping'
                      ? 'Calculated at checkout'
                      : selectedDeliveryMode.price > 0
                      ? formatCurrency(selectedDeliveryMode.price)
                      : '$0.00 (Pickup)'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-1.5 border-t border-border">
                <div>
                  <span className="text-sm font-bold text-text">Total (USD)</span>
                  {selectedDeliveryMode?.id === 'fedex-shipping' && (
                    <span className="text-[10px] text-purple-700 font-medium block">
                      + FedEx fee calculated at checkout
                    </span>
                  )}
                </div>
                <span className="text-base sm:text-lg font-bold text-brand-900 tabular-nums">
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
              className="w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
