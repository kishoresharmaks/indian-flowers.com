'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ShoppingBag, Receipt, Printer, Phone, Mail, MapPin, ExternalLink, Calendar, CheckCircle2, Clock } from 'lucide-react';
import PrintableDocumentModal from '../shared/PrintableDocumentModal';
import POSReceipt from '@/app/admin/dashboard/components/pos/POSReceipt';
import { formatCurrency } from '@/lib/currency';

interface CustomerLedgerModalProps {
  party: any;
  onClose: () => void;
}

export default function CustomerLedgerModal({ party, onClose }: CustomerLedgerModalProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedPosOrder, setSelectedPosOrder] = useState<any>(null);

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/billing/parties/history?phone=${encodeURIComponent(party.phone)}&partyId=${party._id || ''}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerHistory();
  }, [party]);

  const handlePrintItem = (tx: any) => {
    if (tx.type === 'POS_SALE') {
      setSelectedPosOrder(tx.rawDoc);
    } else {
      setSelectedDoc(tx.rawDoc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-hidden print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-[#E8EDF2] shadow-2xl relative overflow-hidden">
        {/* Sticky Header */}
        <div className="p-5 border-b border-[#E8EDF2] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#163B5C]/10 text-[#163B5C] flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#163B5C]">
                Party Account & Transaction Ledger
              </h3>
              <p className="text-xs text-[#64748B]">Complete ledger statements & transaction logs for {party.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCustomerHistory}
              className="p-2 rounded-xl border border-[#E8EDF2] text-[#163B5C] hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#64748B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/50">
          {/* Customer Detail Banner */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#163B5C]">{party.name}</h2>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                  {party.partyType || 'CUSTOMER'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                <span className="flex items-center gap-1 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-[#ED3500]" /> {party.phone}
                </span>
                {party.email && party.email !== 'pos@beeshubfarmland.com' && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-500" /> {party.email}
                  </span>
                )}
                {party.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {party.address}
                  </span>
                )}
              </div>
            </div>

            {/* Live Balance Card */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">Current Account Balance</span>
              {party.currentBalance > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  + {formatCurrency(party.currentBalance)} (To Receive)
                </span>
              ) : party.currentBalance < 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  - {formatCurrency(Math.abs(party.currentBalance))} (To Pay / Credit)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                  $0 (Settled)
                </span>
              )}
            </div>
          </div>

          {/* Transactions List Table */}
          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-2xs overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-3">
              <h4 className="font-extrabold text-xs text-[#163B5C] uppercase tracking-wider">
                Order & Purchase History ({transactions.length})
              </h4>
              <span className="text-xs text-[#64748B]">All Orders & Tax Invoices</span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 text-[#ED3500] animate-spin mx-auto" />
                <span className="text-xs text-[#64748B] mt-2 block font-semibold">Loading customer order history...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-1">
                <ShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-bold">No orders or transactions found for this customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                      <th className="p-3">Doc No & Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Balance Due</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EDF2]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-[#163B5C]">{tx.docNumber}</div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {new Date(tx.date).toLocaleDateString('en-US')} {new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-3">
                          {tx.type === 'POS_SALE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              🧾 POS SALE
                            </span>
                          ) : tx.type === 'ONLINE_ORDER' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                              🛒 ONLINE ORDER
                            </span>
                          ) : tx.type === 'SALE_RETURN' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                              ↩️ SALE RETURN
                            </span>
                          ) : tx.type === 'PURCHASE_BILL' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                              📦 PURCHASE BILL
                            </span>
                          ) : tx.type === 'PURCHASE_ORDER' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">
                              📋 PURCHASE ORDER
                            </span>
                          ) : tx.type === 'PURCHASE_RETURN' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                              ↩️ PURCHASE RETURN
                            </span>
                          ) : tx.type === 'PAYMENT_IN' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              💵 PAYMENT IN
                            </span>
                          ) : tx.type === 'PAYMENT_OUT' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              💸 PAYMENT OUT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              📄 SALE INVOICE
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              tx.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.paymentStatus || 'Pending'} ({tx.paymentMethod})
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-[#163B5C]">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {formatCurrency(tx.balanceAmount || 0)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePrintItem(tx)}
                            className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-[#163B5C] hover:text-white text-[#163B5C] font-bold text-xs flex items-center gap-1 mx-auto transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Document Modal for Invoices */}
      {selectedDoc && (
        <PrintableDocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}

      {/* POS Receipt Modal */}
      {selectedPosOrder && (
        <POSReceipt order={selectedPosOrder} onClose={() => setSelectedPosOrder(null)} />
      )}
    </div>
  );
}
