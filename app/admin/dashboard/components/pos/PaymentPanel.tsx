'use client';

import React, { useState } from 'react';
import { QrCode, DollarSign, UserCheck, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface PaymentPanelProps {
  finalTotal: number;
  paymentMethod: 'CASH' | 'UPI';
  onUpdatePaymentMethod: (method: 'CASH' | 'UPI') => void;
  cashReceived: number;
  onUpdateCashReceived: (val: number) => void;
  transactionId: string;
  onUpdateTransactionId: (val: string) => void;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  onUpdateCustomer: (details: { customerName?: string; customerPhone?: string; customerEmail?: string }) => void;
  onSubmitPOS: () => void;
  isSubmitting: boolean;
  isCartEmpty: boolean;
  merchantUpiId?: string;
}

export default function PaymentPanel({
  finalTotal,
  paymentMethod,
  onUpdatePaymentMethod,
  cashReceived,
  onUpdateCashReceived,
  transactionId,
  onUpdateTransactionId,
  customerName,
  customerPhone,
  customerEmail,
  onUpdateCustomer,
  onSubmitPOS,
  isSubmitting,
  isCartEmpty,
  merchantUpiId = process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || '',
}: PaymentPanelProps) {
  const [isGuest, setIsGuest] = useState(true);
  const [showUpiQr, setShowUpiQr] = useState(false);

  const changeReturned = cashReceived >= finalTotal ? Math.round(cashReceived - finalTotal) : 0;

  // Show insufficient cash alert ONLY if cashier actually typed an amount > 0 that is less than total
  const isCashEnteredLessThanTotal =
    paymentMethod === 'CASH' && cashReceived > 0 && cashReceived < finalTotal;

  const isCannotSubmit =
    isCartEmpty ||
    isSubmitting ||
    (paymentMethod === 'CASH' && (cashReceived < finalTotal || finalTotal <= 0));

  // Quick Cash preset buttons
  const quickCashOptions = [100, 200, 500, 2000].filter((val) => val >= finalTotal);

  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(
    'Nexus Ecom'
  )}&am=${finalTotal}&cu=USD&tn=POS%20Bill`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUrl)}`;

  return (
    <div className="bg-white rounded-2xl border border-[#E8EDF2] p-4 space-y-3.5 shadow-sm">
      {/* 1. Customer Account Selector */}
      <div className="space-y-2 pb-3 border-b border-[#E8EDF2]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#163B5C] uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#ED3500]" /> Customer Account
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsGuest(true);
                onUpdateCustomer({
                  customerName: 'Walk-in Guest',
                  customerPhone: '0000000000',
                  customerEmail: '',
                });
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                isGuest
                  ? 'bg-[#163B5C] text-white border-[#163B5C] shadow-xs'
                  : 'bg-white text-[#64748B] border-[#E8EDF2] hover:text-[#163B5C]'
              }`}
            >
              1-Click Guest
            </button>
            <button
              type="button"
              onClick={() => {
                setIsGuest(false);
                if (customerName === 'Walk-in Guest') {
                  onUpdateCustomer({ customerName: '', customerPhone: '', customerEmail: '' });
                }
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold border transition-all ${
                !isGuest
                  ? 'bg-[#163B5C] text-white border-[#163B5C] shadow-xs'
                  : 'bg-white text-[#64748B] border-[#E8EDF2] hover:text-[#163B5C]'
              }`}
            >
              Customer Info
            </button>
          </div>
        </div>

        {!isGuest && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <input
              type="text"
              placeholder="Customer Name *"
              value={customerName === 'Walk-in Guest' ? '' : customerName}
              onChange={(e) => onUpdateCustomer({ customerName: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500]"
            />
            <input
              type="text"
              placeholder="Mobile Number *"
              value={customerPhone === '0000000000' ? '' : customerPhone}
              onChange={(e) => onUpdateCustomer({ customerPhone: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-[#E8EDF2] text-xs font-semibold focus:outline-none focus:border-[#ED3500]"
            />
          </div>
        )}
      </div>

      {/* 2. Select Payment Method (CASH / UPI) */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-black text-[#163B5C] uppercase tracking-wider block">
          Select Payment Method
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* CASH Button */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMethod('CASH')}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              paymentMethod === 'CASH'
                ? 'border-[#ED3500] bg-[#FFF8F5] ring-2 ring-[#ED3500]/20 shadow-xs'
                : 'border-[#E8EDF2] bg-white hover:border-[#163B5C]/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs text-[#163B5C] block">CASH Counter</span>
                <span className="text-[10px] text-[#64748B]">Physical Cash</span>
              </div>
            </div>
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'CASH'
                  ? 'border-[#ED3500] bg-[#ED3500]'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {paymentMethod === 'CASH' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
          </button>

          {/* UPI Button */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMethod('UPI')}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              paymentMethod === 'UPI'
                ? 'border-[#ED3500] bg-[#FFF8F5] ring-2 ring-[#ED3500]/20 shadow-xs'
                : 'border-[#E8EDF2] bg-white hover:border-[#163B5C]/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs text-[#163B5C] block">Online UPI QR</span>
                <span className="text-[10px] text-[#64748B]">GPay, PhonePe</span>
              </div>
            </div>
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'UPI'
                  ? 'border-[#ED3500] bg-[#ED3500]'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {paymentMethod === 'UPI' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
          </button>
        </div>

        {/* CASH Details & Change Return Calculator */}
        {paymentMethod === 'CASH' && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-extrabold text-[#163B5C]">Cash Received ($):</label>
              <input
                type="number"
                min="0"
                placeholder={finalTotal > 0 ? `e.g. ${finalTotal}` : '0'}
                value={cashReceived || ''}
                onChange={(e) => onUpdateCashReceived(Number(e.target.value))}
                className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 font-extrabold text-sm text-[#163B5C] focus:outline-none focus:border-[#ED3500] bg-white"
              />
            </div>

            {/* Quick cash buttons including Exact Amount */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#64748B] uppercase">Quick Cash:</span>
              {finalTotal > 0 && (
                <button
                  type="button"
                  onClick={() => onUpdateCashReceived(finalTotal)}
                  className="px-2.5 py-1 rounded-lg bg-[#ED3500] text-white text-[10px] font-extrabold shadow-2xs hover:bg-[#D02E00] transition-colors"
                >
                  Exact (${finalTotal})
                </button>
              )}
              {quickCashOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onUpdateCashReceived(amount)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[10px] font-extrabold text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Change returned output */}
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-amber-200/80">
              <span className="font-bold text-[#163B5C]">Change to Return:</span>
              <span
                className={`text-lg font-black ${
                  isCashEnteredLessThanTotal ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                ${changeReturned.toLocaleString('en-US')}
              </span>
            </div>

            {isCashEnteredLessThanTotal && (
              <div className="p-2 rounded-lg bg-rose-100/90 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cash received is less than bill total!</span>
              </div>
            )}
          </div>
        )}

        {/* UPI Details & QR Popup Trigger */}
        {paymentMethod === 'UPI' && (
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-950">Counter UPI QR Code</span>
              <button
                type="button"
                onClick={() => setShowUpiQr(!showUpiQr)}
                className="px-2.5 py-1 rounded-lg bg-purple-700 text-white font-bold text-[10px] uppercase flex items-center gap-1 shadow-xs hover:bg-purple-800"
              >
                <QrCode className="w-3 h-3" /> {showUpiQr ? 'Hide QR' : 'Show Counter QR'}
              </button>
            </div>

            {showUpiQr && (
              <div className="text-center p-3 bg-white rounded-xl border border-purple-200 space-y-1.5">
                <img src={qrImageUrl} alt="POS UPI QR" className="w-32 h-32 mx-auto rounded-lg border border-purple-100" />
                <span className="font-mono text-[10px] font-bold text-purple-900 block">
                  VPA: {merchantUpiId}
                </span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="font-bold text-[#163B5C] text-[11px]">Optional UTR / Ref No:</label>
              <input
                type="text"
                placeholder="e.g. 428901928374"
                value={transactionId}
                onChange={(e) => onUpdateTransactionId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-semibold focus:outline-none focus:border-[#ED3500] bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Complete Sale Action CTA Button */}
      <button
        type="button"
        disabled={isCannotSubmit}
        onClick={onSubmitPOS}
        className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 ${
          isCannotSubmit
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-[#ED3500] hover:bg-[#D02E00] text-white shadow-[#ED3500]/25'
        }`}
      >
        {isSubmitting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4" /> Complete POS Sale & Print Bill
          </>
        )}
      </button>
    </div>
  );
}
