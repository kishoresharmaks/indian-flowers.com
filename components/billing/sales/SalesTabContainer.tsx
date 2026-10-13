'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, RefreshCw, Filter, FileText, ArrowRight, DollarSign, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import SaleInvoiceForm from './SaleInvoiceForm';
import PaymentInModal from './PaymentInModal';
import PrintableDocumentModal from '../shared/PrintableDocumentModal';

interface SalesTabContainerProps {
  products: any[];
}

export default function SalesTabContainer({ products }: SalesTabContainerProps) {
  const [subTab, setSubTab] = useState<'SALE_INVOICE' | 'QUOTATION' | 'PROFORMA' | 'SALE_ORDER' | 'SALE_RETURN' | 'PAYMENT_IN'>('SALE_INVOICE');
  const [documents, setDocuments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDocForPrint, setSelectedDocForPrint] = useState<any | null>(null);
  const [selectedDocForPayment, setSelectedDocForPayment] = useState<any | null>(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      if (subTab === 'PAYMENT_IN') {
        const res = await fetch('/api/billing/payments?paymentType=PAYMENT_IN');
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } else {
        const res = await fetch(`/api/billing/sales?docType=${subTab}`);
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
    fetchSalesData();
  }, [subTab]);

  const handleConvertToInvoice = async (docId: string) => {
    if (!confirm('Convert this document to an official Sale Invoice now? (Stock will be deducted)')) return;

    try {
      const res = await fetch('/api/billing/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_invoice', docId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully converted to Sale Invoice #${data.data.docNumber}`);
        fetchSalesData();
      } else {
        alert(data.message || 'Conversion failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error converting document.');
    }
  };

  const handleDeleteDocument = async (docId: string, docNumber: string, docType: string) => {
    if (!confirm(`Are you sure you want to delete ${docType?.replace('_', ' ')} #${docNumber}?`)) return;

    try {
      const res = await fetch(`/api/billing/sales?id=${docId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchSalesData();
      } else {
        alert(data.message || 'Failed to delete document.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-[#E8EDF2] scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          {[
            { id: 'SALE_INVOICE', label: 'Sale Invoices' },
            { id: 'QUOTATION', label: 'Quotations / Estimates' },
            { id: 'PROFORMA', label: 'Proforma Invoices' },
            { id: 'SALE_ORDER', label: 'Sale Orders' },
            { id: 'SALE_RETURN', label: 'Sales Returns (Credit Notes)' },
            { id: 'PAYMENT_IN', label: 'Payment In Ledger' },
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

        {subTab === 'PAYMENT_IN' ? (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <DollarSign className="w-4 h-4" /> + Record Payment In
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
      ) : subTab === 'PAYMENT_IN' ? (
        /* Payment In Table */
        payments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] p-8 space-y-3">
            <DollarSign className="w-12 h-12 text-[#64748B] mx-auto opacity-40" />
            <h3 className="text-lg font-bold text-[#163B5C]">No Payment In records found</h3>
            <p className="text-xs text-[#64748B]">Click above to record customer payments.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8EDF2] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFFCFB] border-b border-[#E8EDF2] text-[#64748B] font-bold uppercase">
                    <th className="p-4">Date</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4">Ref / UTR No</th>
                    <th className="p-4">Linked Invoice</th>
                    <th className="p-4 text-right">Amount Received</th>
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
                      <td className="p-4 font-bold text-[#ED3500]">{p.docNumber || 'Direct Payment'}</td>
                      <td className="p-4 text-right font-black text-emerald-600 text-sm">
                        + {formatCurrency(p.amount)}
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
                  <th className="p-4">Customer</th>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#163B5C]">{d.docNumber}</span>
                        {d.orderSource && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                              d.orderSource === 'POS'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {d.orderSource}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B] block mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[#163B5C] block">{d.customerName}</span>
                      <span className="text-[11px] text-[#64748B]">{d.customerPhone}</span>
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
                      {(d.docType === 'QUOTATION' || d.docType === 'PROFORMA' || d.docType === 'SALE_ORDER') &&
                        d.status !== 'Converted' &&
                        d.status !== 'Completed' && (
                          <button
                            onClick={() => handleConvertToInvoice(d._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-200"
                            title="Convert to Sale Invoice"
                          >
                            Convert to Invoice ➔
                          </button>
                        )}

                      {/* Record Payment Action for unpaid/partial invoices */}
                      {d.docType === 'SALE_INVOICE' && d.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => {
                            setSelectedDocForPayment(d);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs"
                          title="Record customer payment for this invoice"
                        >
                          <DollarSign className="w-3.5 h-3.5 inline mr-0.5" /> Record Pay
                        </button>
                      )}

                      {/* Print Action */}
                      <button
                        onClick={() => setSelectedDocForPrint(d)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFFCFB] border border-[#E8EDF2] hover:border-[#ED3500] font-bold text-[#163B5C]"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" /> Print
                      </button>

                      {/* Delete Action - ONLY for active/unconverted Quotations */}
                      {d.docType === 'QUOTATION' && d.status !== 'Converted' && d.status !== 'Completed' && (
                        <button
                          onClick={() => handleDeleteDocument(d._id, d.docNumber, d.docType)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold text-xs transition-colors"
                          title="Delete this pending quotation"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                        </button>
                      )}
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
        <SaleInvoiceForm
          docType={subTab as any}
          products={products}
          onClose={() => setIsFormOpen(false)}
          onSuccess={fetchSalesData}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentInModal
          linkedDoc={selectedDocForPayment}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedDocForPayment(null);
          }}
          onSuccess={fetchSalesData}
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
