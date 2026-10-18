'use client';

import React, { useState } from 'react';
import { X, History, Clock, User, ChevronDown, ChevronUp, FileText, ArrowRight, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface RevisionSnapshot {
  items?: any[];
  subtotal?: number;
  totalTax?: number;
  totalGst?: number;
  discountAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  balanceAmount?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
}

export interface ISaleRevisionItem {
  revisionNumber: number;
  revisedAt: string | Date;
  revisedBy?: string;
  reason: string;
  previousTotal: number;
  newTotal: number;
  snapshot: RevisionSnapshot;
  changeSummary?: string;
}

interface RevisionHistoryModalProps {
  document: {
    _id: string;
    docType: string;
    docNumber: string;
    revision?: number;
    revisions?: ISaleRevisionItem[];
    grandTotal: number;
    customerName: string;
    createdAt: string | Date;
  };
  onClose: () => void;
}

export default function RevisionHistoryModal({ document, onClose }: RevisionHistoryModalProps) {
  const revisions: ISaleRevisionItem[] = document.revisions || [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First (latest) expanded by default

  const sortedRevisions = [...revisions].sort(
    (a, b) => Number(b.revisionNumber) - Number(a.revisionNumber)
  );

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'QUOTATION':
        return 'Quotation / Estimate';
      case 'SALE_ORDER':
        return 'Sales Order';
      case 'SALE_INVOICE':
        return 'Sale Invoice';
      case 'PROFORMA':
        return 'Proforma Invoice';
      default:
        return type?.replace('_', ' ');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-6 border border-[#E8EDF2] shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E8EDF2] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-[#163B5C]">
                  Revision History
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Rev #{document.revision || revisions.length}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {getDocTypeLabel(document.docType)} <strong className="text-[#163B5C]">#{document.docNumber}</strong> — {document.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-[#64748B] uppercase block">Total Revisions</span>
            <span className="text-lg font-black text-[#163B5C] mt-0.5 block">{revisions.length}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Current Grand Total</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5 block">
              {formatCurrency(document.grandTotal)}
            </span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200/80">
            <span className="text-[10px] font-bold text-indigo-800 uppercase block">Initial Created</span>
            <span className="text-xs font-bold text-indigo-900 mt-1 block truncate">
              {new Date(document.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Revisions Timeline List */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {sortedRevisions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <History className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="font-bold text-sm text-[#163B5C]">Original Initial Version (Rev #0)</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No subsequent revisions recorded yet. When this document is edited, a complete immutable revision snapshot will be saved here automatically.
              </p>
            </div>
          ) : (
            sortedRevisions.map((rev, idx) => {
              const isExpanded = expandedIndex === idx;
              const dateStr = new Date(rev.revisedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              const diff = Number(rev.newTotal || 0) - Number(rev.previousTotal || 0);

              return (
                <div
                  key={rev.revisionNumber || idx}
                  className="rounded-2xl border border-[#E8EDF2] bg-white overflow-hidden shadow-2xs transition-all"
                >
                  {/* Revision Accordion Header */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="p-4 bg-gradient-to-r from-[#FFFCFB] to-white flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shrink-0 shadow-2xs">
                        Rev #{rev.revisionNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-[#163B5C] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                            {dateStr}
                          </span>
                          <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                            <User className="w-3 h-3 text-[#64748B]" />
                            {rev.revisedBy || 'Admin'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 mt-1 line-clamp-1 italic">
                          &ldquo;{rev.reason}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-extrabold text-[#163B5C] flex items-center gap-1.5 justify-end">
                          <span className="text-[#64748B] line-through font-normal">{formatCurrency(rev.previousTotal)}</span>
                          <ArrowRight className="w-3 h-3 text-[#64748B]" />
                          <span className="text-emerald-700 font-black">{formatCurrency(rev.newTotal)}</span>
                        </div>
                        <span className={`text-[10px] font-bold block ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                        </span>
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[#64748B]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Snapshot Details */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-[#E8EDF2] bg-slate-50/50 space-y-4">
                      {/* Reason Quote Banner */}
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900">
                        <strong className="font-bold">Revision Note:</strong> {rev.reason}
                      </div>

                      {/* Snapshot Items Table */}
                      {rev.snapshot?.items && rev.snapshot.items.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-extrabold text-[#163B5C] uppercase tracking-wider block">
                            Document Items Snapshot At Revision #{rev.revisionNumber}
                          </span>
                          <div className="bg-white rounded-xl border border-[#E8EDF2] overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-[#64748B] font-bold uppercase text-[10px] border-b border-[#E8EDF2]">
                                  <th className="p-2.5">Item Name</th>
                                  <th className="p-2.5 text-center">Qty</th>
                                  <th className="p-2.5 text-right">Unit Price</th>
                                  <th className="p-2.5 text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E8EDF2]">
                                {rev.snapshot.items.map((it: any, iIdx: number) => (
                                  <tr key={iIdx} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 font-bold text-[#163B5C]">
                                      {it.name}
                                      {it.variantName && (
                                        <span className="text-[11px] font-normal text-[#64748B] ml-1">
                                          ({it.variantName})
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center font-extrabold text-[#163B5C]">
                                      {it.quantity}
                                    </td>
                                    <td className="p-2.5 text-right text-slate-600">
                                      {formatCurrency(it.price)}
                                    </td>
                                    <td className="p-2.5 text-right font-extrabold text-[#163B5C]">
                                      {formatCurrency(it.lineTotal || it.price * it.quantity)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Snapshot Customer & Financial Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-[#E8EDF2] space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase block">Customer Details</span>
                          <p className="font-bold text-[#163B5C]">{rev.snapshot?.customerName || document.customerName}</p>
                          <p className="text-[#64748B]">{rev.snapshot?.customerPhone}</p>
                          {rev.snapshot?.customerEmail && (
                            <p className="text-[#64748B]">{rev.snapshot.customerEmail}</p>
                          )}
                          {(rev.snapshot?.billingAddress || rev.snapshot?.shippingAddress) && (
                            <p className="text-[11px] text-[#64748B] mt-1 pt-1 border-t border-slate-100">
                              {rev.snapshot?.billingAddress || rev.snapshot?.shippingAddress}
                            </p>
                          )}
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-[#E8EDF2] space-y-1">
                          <span className="text-[10px] font-bold text-[#64748B] uppercase block">Financial Summary</span>
                          <div className="flex justify-between text-[#64748B]">
                            <span>Subtotal:</span>
                            <span className="font-medium text-[#163B5C]">
                              {formatCurrency(rev.snapshot?.subtotal || 0)}
                            </span>
                          </div>
                          {Boolean(rev.snapshot?.totalGst || rev.snapshot?.totalTax) && (
                            <div className="flex justify-between text-[#64748B]">
                              <span>Sales Tax / GST:</span>
                              <span className="font-medium text-[#163B5C]">
                                {formatCurrency(rev.snapshot?.totalTax || rev.snapshot?.totalGst || 0)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-sm text-[#163B5C] pt-1 border-t border-slate-100">
                            <span>Snapshot Total:</span>
                            <span className="text-emerald-700">{formatCurrency(rev.snapshot?.grandTotal || rev.newTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E8EDF2] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#163B5C] hover:bg-[#0F2A42] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Close Revision History
          </button>
        </div>
      </div>
    </div>
  );
}
