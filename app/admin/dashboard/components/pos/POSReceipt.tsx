'use client';

import React from 'react';
import { Printer, MessageCircle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface POSReceiptProps {
  order: any;
  onClose: () => void;
  onNewSale?: () => void;
}

export default function POSReceipt({ order, onClose, onNewSale }: POSReceiptProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppReceiptUrl = () => {
    const phone = order.customerPhone && order.customerPhone !== '0000000000'
      ? order.customerPhone.replace(/\D/g, '')
      : '';

    const itemsText = order.items
      ? order.items.map((it: any) => `• ${it.name}${it.variantName ? ` (${it.variantName})` : ''} x ${it.quantity} = ${formatCurrency(it.price * it.quantity)}`).join('\n')
      : '';

    const text = `🌸 *INDIAN-FLOWERS.COM*
🧾 *TAX INVOICE / POS RECEIPT*

📄 *Invoice No:* ${order.invoiceNumber || order.orderId}
📅 *Date:* ${new Date(order.createdAt).toLocaleString('en-US')}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
👤 *Cashier:* ${order.cashierName || 'Store Counter'}

🛒 *ITEMS PURCHASED:*
${itemsText}

──────────────────
💰 *Subtotal:* ${formatCurrency(order.subtotal || 0)}
🏛️ *Sales Tax:* ${formatCurrency(order.totalTax !== undefined ? order.totalTax : order.totalGst || 0)}
${order.discountAmount ? `🏷️ *Discount:* -${formatCurrency(order.discountAmount)}\n` : ''}💵 *Grand Total:* ${formatCurrency(order.totalAmount || 0)}
💳 *Payment Mode:* ${order.paymentMethod}
${order.paymentMethod === 'CASH' ? `💵 *Cash Received:* ${formatCurrency(order.cashReceived || 0)}\n🪙 *Change Returned:* ${formatCurrency(order.changeReturned || 0)}\n` : ''}
Thank you for shopping with Indian-Flowers.com!
Visit: https://indian-flowers.com`;

    const targetPhone = phone.length === 10 ? `1${phone}` : phone;
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      {/* CSS Print Styles targeting POS Thermal Slip */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          html, body {
            width: 80mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #pos-thermal-receipt,
          #pos-thermal-receipt * {
            visibility: visible !important;
          }
          #pos-thermal-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            font-size: 11px !important;
            font-family: monospace !important;
            color: black !important;
            background: white !important;
            line-height: 1.3 !important;
            z-index: 999999 !important;
          }
          .print\\:hidden, button, header, nav {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E8EDF2] shadow-2xl relative flex flex-col justify-between">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E8EDF2] flex items-center justify-between bg-[#FFF8F5] rounded-t-3xl">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-extrabold text-base text-[#163B5C]">POS Sale Completed</h3>
              <span className="text-[11px] font-mono text-[#64748B] block">
                {order.invoiceNumber || order.orderId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white text-[#64748B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-6 space-y-4 font-mono text-xs text-black" id="pos-thermal-receipt">
          {/* Header Branding */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            <h2 className="font-bold text-sm uppercase tracking-tight">
              {process.env.NEXT_PUBLIC_COMPANY_NAME || 'INDIAN FLOWERS'}
            </h2>
            {process.env.NEXT_PUBLIC_COMPANY_ADDRESS ? (
              <p className="text-[10px] text-gray-600 leading-tight">
                {process.env.NEXT_PUBLIC_COMPANY_ADDRESS}
              </p>
            ) : null}
            <p className="text-[10px] text-gray-600">
              {process.env.NEXT_PUBLIC_COMPANY_PHONE ? `Phone: ${process.env.NEXT_PUBLIC_COMPANY_PHONE}` : 'Indian-Flowers.com'}
              {process.env.NEXT_PUBLIC_COMPANY_EIN ? ` | EIN: ${process.env.NEXT_PUBLIC_COMPANY_EIN}` : ''}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-gray-100 font-bold text-[10px] uppercase">
              POS RECEIPT
            </span>
          </div>

          {/* Invoice Meta */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span>Invoice No:</span>
              <strong className="font-bold">{order.invoiceNumber || order.orderId}</strong>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{new Date(order.createdAt).toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{order.cashierName || 'Store Counter'}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2 pb-3 border-b border-dashed border-gray-300">
            <div className="grid grid-cols-12 font-bold text-[10px] uppercase border-b border-gray-200 pb-1">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-4 text-right">Amt ($)</span>
            </div>
            {order.items.map((it: any, idx: number) => (
              <div key={idx} className="grid grid-cols-12 text-[11px] items-center">
                <span className="col-span-6 line-clamp-1 font-semibold">
                  {it.name} {it.variantName ? `(${it.variantName})` : ''}
                </span>
                <span className="col-span-2 text-center">{it.quantity}</span>
                <span className="col-span-4 text-right font-bold">
                  {formatCurrency(it.price * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Sales Tax:</span>
              <span>{formatCurrency(order.totalTax !== undefined ? order.totalTax : order.totalGst || 0)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-black">
              <span>FINAL GRAND TOTAL:</span>
              <span>{formatCurrency(order.totalAmount || 0)}</span>
            </div>

            {/* Payment Details */}
            <div className="pt-2 text-[11px] space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-200 mt-2">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <strong className="font-bold">{order.paymentMethod}</strong>
              </div>
              {order.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>{formatCurrency(order.cashReceived || 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change Returned:</span>
                    <span>{formatCurrency(order.changeReturned || 0)}</span>
                  </div>
                </>
              )}
              {(order.paymentMethod === 'CreditCard' || order.paymentMethod === 'Razorpay') && order.transactionId && (
                <div className="flex justify-between">
                  <span>Payment / Auth ID:</span>
                  <span className="font-mono text-[10px]">{order.transactionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-dashed border-gray-300">
            <p>Thank you for shopping with Indian-Flowers.com!</p>
            <p>Fresh Authentic Indian Flowers Delivered Across USA</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-[#E8EDF2] space-y-2 bg-[#FFFCFB] rounded-b-3xl">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl bg-[#163B5C] hover:bg-[#163B5C]/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" /> Print Thermal Slip
            </button>
            <a
              href={getWhatsAppReceiptUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all text-center"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Receipt
            </a>
          </div>

          <button
            onClick={onNewSale}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#ED3500]/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Start Next Counter Sale
          </button>
        </div>
      </div>
    </div>
  );
}
