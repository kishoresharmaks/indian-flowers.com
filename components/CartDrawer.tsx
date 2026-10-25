'use client';

import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, Plane, Truck, MapPin, Store, Check, Info } from 'lucide-react';
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

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-xl z-[100] flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[#111827]">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ivory transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-text" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-12 h-12 text-text-muted" />
              <div>
                <p className="text-text-muted text-sm font-normal">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="text-brand-700 text-sm font-medium hover:underline mt-2"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item.product._id}-${item.selectedVariant?.name || 'default'}`}
                className="flex gap-3 pb-3 border-b border-border last:border-0"
              >
                {/* Thumbnail */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-ivory"
                />

                {/* Details */}
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-medium text-text line-clamp-2">
                    {item.product.name}
                  </h4>
                  {item.selectedVariant?.name && (
                    <div className="pt-0.5">
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        {item.selectedVariant.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-brand-900 tabular-nums">
                    {formatCurrency(item.selectedVariant?.price ?? item.product.price ?? 0)}
                  </p>

                  {/* Quantity Control */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        onUpdateQuantity(
                          item.product._id,
                          item.selectedVariant?.name,
                          item.quantity - 1
                        )
                      }
                      className="p-1 rounded hover:bg-ivory transition-colors"
                    >
                      <Minus className="w-4 h-4 text-text-muted" />
                    </button>
                    <span className="text-xs font-medium text-text w-6 text-center tabular-nums">
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
                      className="p-1 rounded hover:bg-ivory transition-colors"
                    >
                      <Plus className="w-4 h-4 text-text-muted" />
                    </button>
                    <button
                      onClick={() =>
                        onRemove(item.product._id, item.selectedVariant?.name)
                      }
                      className="ml-auto p-1 rounded hover:bg-error-bg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

                {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3.5 bg-white">
            {/* Delivery Modes Selector */}
            {deliveryModes && deliveryModes.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand-700" />
                    <span>Delivery Mode</span>
                  </span>
                  {selectedDeliveryMode && (
                    <span className="text-[11px] font-semibold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {selectedDeliveryMode.price > 0 ? formatCurrency(selectedDeliveryMode.price) : 'Local Pickup'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {deliveryModes
                    .filter((m) => m.active !== false)
                    .map((mode) => {
                      const isSelected = selectedDeliveryMode?.id === mode.id;
                      const isPickup = mode.type === 'pickup';

                      return (
                        <label
                          key={mode.id}
                          onClick={() => onSelectDeliveryMode?.(mode)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-brand-700 bg-brand-50/60 ring-1 ring-brand-700'
                              : 'border-border hover:border-stone-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cartDeliveryMode"
                            checked={isSelected}
                            onChange={() => onSelectDeliveryMode?.(mode)}
                            className="mt-0.5 w-3.5 h-3.5 text-brand-700 focus:ring-brand-700 accent-brand-700 shrink-0 cursor-pointer"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                                {isPickup ? (
                                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : mode.name.toLowerCase().includes('air') || mode.name.toLowerCase().includes('flight') || mode.name.toLowerCase().includes('south') ? (
                                  <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                ) : (
                                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                                <span className="truncate">{mode.name}</span>
                              </span>
                              <span className="text-xs font-bold text-brand-900 shrink-0 tabular-nums">
                                {mode.price > 0 ? formatCurrency(mode.price) : '$0.00'}
                              </span>
                            </div>

                            {mode.description && (
                              <p className={`text-[10px] mt-0.5 line-clamp-2 leading-relaxed ${
                                isPickup ? 'text-amber-700 font-medium' : 'text-text-muted'
                              }`}>
                                {mode.description}
                              </p>
                            )}
                            {mode.id === 'fedex-shipping' && (
                              <p className="text-[9px] text-purple-700 font-medium mt-0.5">
                                Dynamic location pricing applied based on destination ZIP code.
                              </p>
                            )}
                            {isPickup && mode.pickupLocation && (
                              <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                                Hub: {mode.pickupLocation}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs font-normal">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-text">{formatCurrency(subtotal)}</span>
              </div>
              {selectedDeliveryMode && (
                <div className="flex justify-between text-text-muted">
                  <span className="truncate pr-2">
                    Shipment ({selectedDeliveryMode.name}):
                  </span>
                  <span className="tabular-nums font-semibold text-brand-900 shrink-0">
                    {selectedDeliveryMode.price > 0 ? formatCurrency(selectedDeliveryMode.price) : '$0.00 (Pay at Pickup)'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Estimated Tax</span>
                <span className="tabular-nums font-medium text-text">{formatCurrency(gstTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-text border-t border-border pt-2">
                <span>Total</span>
                <span className="tabular-nums text-brand-900">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={onCheckout}
              className="w-full px-4 py-3 rounded-lg bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium transition-all shadow-xs"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
