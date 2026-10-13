'use client';

import React from 'react';
import { Trash2, Plus, Minus, Tag, Pause, Play, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export interface POSCartItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  gst: number;
  image?: string;
}

interface POSCartProps {
  items: POSCartItem[];
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  onUpdateQty: (productId: string, variantName: string | undefined, delta: number) => void;
  onRemoveItem: (productId: string, variantName?: string) => void;
  onUpdateDiscount: (type: 'FLAT' | 'PERCENTAGE', value: number) => void;
  onClearCart: () => void;
  onHoldBill: () => void;
  heldBillsCount: number;
  onOpenHeldBillsModal: () => void;
}

export default function POSCart({
  items,
  discountType,
  discountValue,
  onUpdateQty,
  onRemoveItem,
  onUpdateDiscount,
  onClearCart,
  onHoldBill,
  heldBillsCount,
  onOpenHeldBillsModal,
}: POSCartProps) {
  // Calculations
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalGst = items.reduce(
    (sum, item) => sum + Math.round(item.price * item.quantity * (item.gst / 100)),
    0
  );

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = Math.round(subtotal * (discountValue / 100));
  } else {
    discountAmount = Math.round(discountValue);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const finalTotal = Math.max(0, subtotal + totalGst - discountAmount);

  return (
    <div className="bg-white rounded-2xl border border-[#E8EDF2] flex flex-col h-full shadow-sm overflow-hidden">
      {/* 1. Header Bar */}
      <div className="p-3.5 px-4 bg-[#FFFCFB] border-b border-[#E8EDF2] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#ED3500]/10 text-[#ED3500] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-xs text-[#163B5C] uppercase tracking-wide">
              Active POS Cart
            </h3>
            <span className="text-[10px] font-bold text-[#64748B] block">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'} Selected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {heldBillsCount > 0 && (
            <button
              type="button"
              onClick={onOpenHeldBillsModal}
              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 transition-all shadow-2xs"
            >
              <Play className="w-3 h-3 text-amber-600" /> Held ({heldBillsCount})
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={onHoldBill}
              className="px-2.5 py-1 rounded-lg bg-white text-[#64748B] border border-[#E8EDF2] text-[11px] font-bold hover:text-[#ED3500] hover:border-[#ED3500]/30 transition-all flex items-center gap-1 shadow-2xs"
            >
              <Pause className="w-3 h-3 text-amber-600" /> Hold Bill
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all"
              title="Clear POS Cart"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[140px] max-h-[260px]">
        {items.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#64748B] space-y-1.5">
            <ShoppingBag className="w-8 h-8 text-[#64748B] mx-auto opacity-30" />
            <p className="font-extrabold text-[#163B5C]">POS Cart is Empty</p>
            <p className="text-[11px]">Scan barcode or tap items from product grid to add.</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={`${item.productId}-${item.variantName || 'base'}-${idx}`}
              className="p-2.5 rounded-xl bg-[#FFFCFB] border border-[#E8EDF2] flex items-center justify-between gap-2 text-xs hover:border-[#ED3500]/30 transition-all"
            >
              {/* Image & Title */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg bg-white border border-[#E8EDF2] shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[#163B5C] truncate text-xs">{item.name}</h4>
                  <div className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                    {item.variantName && (
                      <span className="font-black text-[#ED3500] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        {item.variantName}
                      </span>
                    )}
                    <span>{formatCurrency(item.price)}</span>
                    <span>({item.gst}% GST)</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Line Total */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-[#E8EDF2] rounded-lg bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.productId, item.variantName, -1)}
                    className="p-1 px-1.5 hover:bg-gray-100 text-[#163B5C] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 font-black text-xs text-[#163B5C] min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(item.productId, item.variantName, 1)}
                    className="p-1 px-1.5 hover:bg-gray-100 text-[#163B5C] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <span className="font-black text-xs text-[#163B5C] min-w-[55px] text-right">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.productId, item.variantName)}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Footer Summary & Discount Bar */}
      {items.length > 0 && (
        <div className="p-3.5 bg-[#FFFCFB] border-t border-[#E8EDF2] space-y-2.5 shrink-0">
          {/* Counter Discount Control Bar */}
          <div className="flex items-center justify-between text-xs gap-2 p-2 rounded-xl bg-white border border-[#E8EDF2]">
            <span className="font-extrabold text-[#163B5C] flex items-center gap-1.5 text-[11px] shrink-0">
              <Tag className="w-3.5 h-3.5 text-[#ED3500]" /> Counter Discount:
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={discountType}
                onChange={(e) =>
                  onUpdateDiscount(e.target.value as 'FLAT' | 'PERCENTAGE', discountValue)
                }
                className="px-2 py-1 rounded-lg border border-[#E8EDF2] text-xs font-extrabold text-[#163B5C] focus:outline-none focus:border-[#ED3500] bg-gray-50"
              >
                <option value="FLAT">Flat $</option>
                <option value="PERCENTAGE">Discount %</option>
              </select>

              <input
                type="number"
                min="0"
                placeholder="0"
                value={discountValue || ''}
                onChange={(e) => onUpdateDiscount(discountType, Number(e.target.value))}
                className="w-20 px-2 py-1 rounded-lg border border-[#E8EDF2] text-xs font-black text-[#163B5C] focus:outline-none focus:border-[#ED3500]"
              />
            </div>
          </div>

          {/* Subtotal & Grand Total breakdown */}
          <div className="space-y-1 text-xs text-[#64748B]">
            <div className="flex justify-between">
              <span>Subtotal ({totalItemCount} items):</span>
              <span className="font-bold text-[#163B5C]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax Split:</span>
              <span className="font-bold text-[#163B5C]">{formatCurrency(totalGst)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-[#E8EDF2]">
              <span className="font-black text-xs text-[#163B5C] uppercase tracking-wider">
                FINAL BILL TOTAL:
              </span>
              <span className="text-xl font-black text-[#ED3500]">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
