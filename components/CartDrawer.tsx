'use client';

import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
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
}: CartDrawerProps) {
  if (!isOpen) return null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
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
          <div className="border-t border-border p-4 space-y-3">
            {/* Totals */}
            <div className="space-y-2 text-sm font-normal">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Estimated Tax</span>
                <span className="tabular-nums">{formatCurrency(gstTotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-text border-t border-border pt-2">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
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
