'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, RefreshCw, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import PurchaseBillForm from './PurchaseBillForm';
import PaymentOutModal from './PaymentOutModal';
import PrintableDocumentModal from '../shared/PrintableDocumentModal';

interface PurchaseTabContainerProps {
  products: any[];
}

export default function PurchaseTabContainer({ products }: PurchaseTabContainerProps) {
  const [subTab, setSubTab] = useState<'PURCHASE_BILL' | 'PURCHASE_ORDER' | 'PURCHASE_RETURN' | 'PAYMENT_OUT'>('PURCHASE_BILL');
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<any | null>(null);

  const fetchPurchaseData = async () => {
    try {
      setLoading(true);
      if (subTab === 'PAYMENT_OUT') {
        const res = await fetch('/api/billing/payments?paymentType=PAYMENT_OUT');
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } else {
        const res = await fetch(`/api/billing/purchase?docType=${subTab}`);
        const data = await res.json();
        if (data.success) setDocuments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseData();
  }, [subTab]);

  const handleConvertToBill = async (docId: string) => {
    if (!confirm('Convert this PO to an official Purchase Bill now? (Inward stock will be added to inventory)')) return;

    try {
      const res = await fetch('/api/billing/purchase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_bill', docId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully converted to Purchase Bill #${data.data.docNumber}`);
        fetchPurchaseData();
      } else {
        alert(data.message || 'Conversion failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error converting document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-[#E8EDF2] scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          {[
            { id: 'PURCHASE_BILL', label: 'Purchase Bills (Inward Stock)' },
            { id: 'PURCHASE_ORDER', label: 'Purchase Orders (PO)' },
            { id: 'PURCHASE_RETURN', label: 'Purchase Returns (Debit Notes)' },
            { id: 'PAYMENT_OUT', label: 'Payment Out Ledger' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                subTab === tab.id
                  ? 'bg-[#163B5C] text-white shadow-xs'
                  : 'bg-white border border-[#E8EDF2] text-[#64748B] hover:text-[#163B5C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {subTab === 'PAYMENT_OUT' ? (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <DollarSign className="w-4 h-4" /> + Record Payment Out
          </button>
        ) : (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#ED3500] hover:bg-[#D02E00] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" /> Create {subTab.replace('_', ' ')}
          </button>
        )}
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-[#ED3500] animate-spin mx-auto" />
        </div>
      ) : subTab === 'PAYMENT_OUT' ? (
        /* Payment Out Table */
        payments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
            <DollarSign className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
            <h3 className="text-lg font-bold text-[#163B5C]">No Payment Out records found</h3>
            <p className="text-xs text-[#64748B]">Click above to record payouts to suppliers.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                    <th className="p-4">Date</th>
                    <th className="p-4">Vendor Name</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4">Ref / UTR No</th>
                    <th className="p-4">Linked Bill</th>
                    <th className="p-4 text-right">Amount Paid Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FFFCFB]/80">
                      <td className="p-4 font-semibold text-[#64748B]">
                        {new Date(p.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-4 font-bold text-[#163B5C]">{p.partyName}</td>
                      <td className="p-4 font-bold text-slate-700">{p.paymentMode}</td>
                      <td className="p-4 font-mono text-gray-500">{p.referenceNo || '—'}</td>
                      <td className="p-4 font-bold text-[#ED3500]">{p.docNumber || 'Direct Payout'}</td>
                      <td className="p-4 text-right font-black text-rose-600 text-sm">
                        - {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : documents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
          <FileText className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
          <h3 className="text-lg font-bold text-[#163B5C]">No {subTab.replace('_', ' ')} records</h3>
          <p className="text-xs text-[#64748B]">Click button above to issue your first {subTab}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                  <th className="p-4">Doc No & Date</th>
                  <th className="p-4">Vendor / Farmer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {documents.map((d) => (
                  <tr key={d._id} className="hover:bg-[#FFFCFB]/80 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-[#163B5C] block">{d.docNumber}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {new Date(d.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[#163B5C] block">{d.vendorName}</span>
                      <span className="text-[11px] text-[#64748B]">{d.vendorPhone}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          d.status === 'Converted'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                          d.paymentStatus === 'Paid'
                            ? 'bg-emerald-500 text-white'
                            : d.paymentStatus === 'Partial'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 font-black text-[#163B5C]">
                      {formatCurrency(d.grandTotal)}
                    </td>
                    <td className="p-4 font-bold text-rose-600">
                      {formatCurrency(d.balanceAmount)}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {/* Convert 1-Click Action */}
                      {d.docType === 'PURCHASE_ORDER' && d.status !== 'Converted' && (
                        <button
                          onClick={() => handleConvertToBill(d._id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200"
                          title="Convert to Inward Purchase Bill"
                        >
                          Convert to Bill ➔
                        </button>
                      )}

                      {/* Print Action */}
                      <button
                        onClick={() => setSelectedDocForPrint(d)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFFCFB] border border-[#E8EDF2] hover:border-[#ED3500] font-bold text-[#163B5C]"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modals */}
      {isFormOpen && (
        <PurchaseBillForm
          docType={subTab as any}
          products={products}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchPurchaseData}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentOutModal
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={fetchPurchaseData}
        />
      )}

      {selectedDocForPrint && (
        <PrintableDocumentModal
          document={selectedDocForPrint}
          onClose={() => setSelectedDocForPrint(null)}
        />
      )}
    </div>
  );
}
