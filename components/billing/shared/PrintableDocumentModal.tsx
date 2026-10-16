'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import { getCompanyConfig, numberToWords } from '@/lib/companyConfig';
import { formatCurrency } from '@/lib/currency';

interface PrintableDocumentModalProps {
  document?: any;
  doc?: any;
  onClose: () => void;
}

export default function PrintableDocumentModal({
  document: documentProp,
  doc: docProp,
  onClose,
}: PrintableDocumentModalProps) {
  const doc = documentProp || docProp;
  const [dbSettings, setDbSettings] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json?.success && json?.data) {
          setDbSettings(json.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const company = getCompanyConfig(
    dbSettings
      ? {
          name: dbSettings.businessName || dbSettings.siteName,
          address: dbSettings.companyAddress,
          city: dbSettings.companyCity,
          state: dbSettings.companyState,
          zipCode: dbSettings.companyZip,
          country: dbSettings.companyCountry,
          phone: dbSettings.contactPhone,
          email: dbSettings.contactEmail,
          ein: dbSettings.companyTaxId,
          stateTaxPermitId: dbSettings.stateTaxPermitId,
          bankName: dbSettings.bankName,
          bankAccountNo: dbSettings.bankAccountNo,
          bankRoutingNo: dbSettings.bankRoutingNo,
          bankHolder: dbSettings.bankHolder,
          logoUrl: dbSettings.logoDataUrl || undefined,
        }
      : undefined
  );

  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL'>('A4');

  const handlePrint = () => {
    window.print();
  };

  // Determine Exact Title matching PDF templates
  const getDocumentTitle = () => {
    if (!doc?.docType && !doc?.orderType && !doc?.paymentType) return 'Tax Invoice';
    const type = (doc.docType || doc.paymentType || doc.orderType || '').toUpperCase();
    if (type.includes('ESTIMATE') || type.includes('QUOTATION')) return 'Estimate';
    if (type.includes('PAYMENT_IN') || type.includes('PAYMENT_RECEIVED')) return 'Payment-In';
    if (type.includes('PAYMENT_OUT') || type.includes('PAYMENT_PAID')) return 'Payment-Out';
    if (type.includes('CREDIT_NOTE')) return 'Credit Note';
    if (type.includes('PURCHASE_ORDER')) return 'Purchase Order';
    if (type.includes('PURCHASE')) return 'Purchase Invoice';
    if (type.includes('POS')) return 'Tax Invoice';
    return 'Tax Invoice';
  };

  const docTitle = getDocumentTitle();
  const grandTotalNum = Number(doc?.grandTotal || doc?.totalAmount || doc?.amount || 0);

  const getWhatsappText = () => {
    let msg = `*${company.name}*\n`;
    msg += `Document: *${docTitle}*\n`;
    msg += `Doc No: *${doc?.docNumber || doc?.invoiceNumber || doc?.orderId || doc?.referenceNo}*\n`;
    msg += `Date: ${new Date(doc?.createdAt || doc?.date || Date.now()).toLocaleDateString('en-US')}\n`;
    msg += `Party: ${doc?.customerName || doc?.vendorName || doc?.partyName || doc?.partyId?.name || 'Customer'}\n`;
    msg += `--------------------------------\n`;
    doc?.items?.forEach((i: any, idx: number) => {
      msg += `${idx + 1}. ${i.name || i.productName} ${i.variantName ? `(${i.variantName})` : ''} x ${i.quantity} = ${formatCurrency(i.lineTotal || i.total || i.price * i.quantity)}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `Subtotal: ${formatCurrency(doc?.subtotal || 0)}\n`;
    msg += `GST: ${formatCurrency(doc?.totalGst || 0)}\n`;
    msg += `*Grand Total: ${formatCurrency(grandTotalNum)}*\n`;
    msg += `Balance Due: ${formatCurrency(doc?.balanceAmount || 0)}\n`;
    msg += `Payment Status: ${doc?.paymentStatus || 'COMPLETED'}\n`;
    msg += `Thank you for doing business with us! 🌿🌾`;
    return encodeURIComponent(msg);
  };

  const clientName = doc?.customerName || doc?.vendorName || doc?.partyName || doc?.partyId?.name || 'Walk-in Customer';
  const clientPhone = doc?.customerPhone || doc?.vendorPhone || doc?.partyPhone || doc?.partyId?.phone || '';
  const clientAddress = doc?.shippingAddress || doc?.billingAddress || doc?.partyId?.address || '';
  const clientGstin = doc?.partyId?.gstin || doc?.gstin || '';
  const clientState = doc?.partyId?.state || doc?.state || company.state;

  return (
    <div id="printable-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-hidden print:p-0 print:bg-white print:overflow-visible">
      {/* Exact PDF Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: ${printMode === 'THERMAL' ? '80mm auto' : 'A4 portrait'};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }

          /* HIDE ALL BACKGROUND PAGE CONTENT */
          body * {
            visibility: hidden !important;
          }

          /* UN-STYLE MODAL PARENT CONTAINERS SO THEY DON'T CLIP */
          #printable-modal-backdrop,
          #printable-modal-dialog,
          #printable-modal-canvas {
            visibility: visible !important;
            position: static !important;
            display: block !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            inset: auto !important;
          }

          /* UNHIDE PRINTABLE DOCUMENT & ALL ITS CHILDREN */
          #printable-document-area,
          #printable-document-area * {
            visibility: visible !important;
          }

          /* POSITION PDF TEMPLATE AT ABSOLUTE TOP OF PAGE 1 */
          #printable-document-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            width: ${printMode === 'THERMAL' ? '80mm' : '100%'} !important;
            max-width: ${printMode === 'THERMAL' ? '80mm' : '100%'} !important;
            padding: ${printMode === 'THERMAL' ? '4mm' : '12mm 15mm'} !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: ${printMode === 'THERMAL' ? '11px' : '12px'} !important;
            line-height: 1.4 !important;
            z-index: 99999999 !important;
          }

          .print-control-bar,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }

          .pdf-print-flex {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }
          .pdf-print-grid {
            display: flex !important;
            justify-content: space-between !important;
          }
          .pdf-header-bg {
            background-color: #8F8DF5 !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      <div id="printable-modal-dialog" className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-[#E8EDF2] shadow-2xl relative print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-full print:max-h-none overflow-hidden">
        {/* Sticky Control Bar */}
        <div className="print-control-bar p-4 sm:p-5 border-b border-[#E8EDF2] flex items-center justify-between shrink-0 bg-white print:hidden z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8F8DF5]/15 text-[#7B78ED] flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#163B5C]">
                {docTitle} — {doc?.docNumber || doc?.invoiceNumber || doc?.orderId}
              </h3>
              <p className="text-xs text-[#64748B]">Matching PDF Template (*Sales, Estimate, Credit Note, Purchase*)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintMode(printMode === 'A4' ? 'THERMAL' : 'A4')}
              className="px-3.5 py-1.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#163B5C] hover:bg-gray-50"
            >
              Format: {printMode === 'A4' ? '📄 A4 Format' : '🧾 Thermal 80mm'}
            </button>
            <a
              href={`https://wa.me/${(clientPhone || '').replace(/\D/g, '').length === 10 ? '1' + (clientPhone || '').replace(/\D/g, '') : (clientPhone || '').replace(/\D/g, '')}?text=${getWhatsappText()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#7B78ED] hover:bg-[#6865D8] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#7B78ED]/20"
            >
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#64748B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable PDF Template Container */}
        <div id="printable-modal-canvas" className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">

          <div
            id="printable-document-area"
            className={`bg-white p-8 sm:p-10 rounded-xl border border-gray-200 shadow-md text-slate-800 space-y-5 ${printMode === 'THERMAL' ? 'max-w-md mx-auto text-xs font-mono' : 'max-w-3xl mx-auto text-xs sm:text-sm font-sans'
              } print:border-none print:shadow-none print:p-0 print:max-w-full`}
          >
            {/* 1. TOP HEADER SECTION (Matching PDF Template Layout Exactly) */}
            <div className="pdf-print-flex flex justify-between items-start border-b-2 border-[#8F8DF5] pb-4">
              {/* Left Column: Company Details */}
              <div className="space-y-0.5 text-xs text-left">
                <h1 className="font-extrabold text-xl text-slate-900 uppercase tracking-tight">
                  {company.name}
                </h1>
                {company.dba && company.dba !== company.name && (
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{company.dba}</p>
                )}
                {company.owner && <p className="font-semibold text-slate-700">{company.owner}</p>}
                {(company.address || company.city) && (
                  <p className="text-[11px] text-slate-600 max-w-md leading-tight">
                    {company.address}
                    {company.city ? `, ${company.city}` : ''}
                    {company.state ? `, ${company.state}` : ''}
                    {company.zipCode ? ` ${company.zipCode}` : ''}
                    {company.country && company.country !== 'United States' ? `, ${company.country}` : ', USA'}
                  </p>
                )}
                {(company.phone || company.email) && (
                  <p className="text-[11px] text-slate-600">
                    {company.phone && <span><strong>Phone:</strong> {company.phone}</span>}
                    {company.phone && company.email && <span> &nbsp;|&nbsp; </span>}
                    {company.email && <span><strong>Email:</strong> {company.email}</span>}
                  </p>
                )}
                {(company.ein || company.stateTaxPermitId) && (
                  <p className="text-[11px] text-slate-700">
                    {company.ein && <span><strong>EIN:</strong> {company.ein} &nbsp;|&nbsp; </span>}
                    {company.stateTaxPermitId && <span><strong>State Tax Permit:</strong> {company.stateTaxPermitId}</span>}
                  </p>
                )}
              </div>

              {/* Right Column: Company Logo */}
              <div className="text-right flex-shrink-0">
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-white shadow-2xs"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img && img.src.indexOf('indian-flowers-logo.svg') === -1) {
                      img.src = '/indian-flowers-logo.svg';
                    }
                  }}
                />
              </div>
            </div>

            {/* 2. CENTERED DOCUMENT TITLE BANNER */}
            <div className="text-center my-3">
              <h2 className="font-serif font-bold text-2xl text-[#7B78ED] tracking-wide">
                {docTitle}
              </h2>
            </div>

            {/* 3. BILL TO & INVOICE DETAILS ROW */}
            <div className="pdf-print-grid flex justify-between gap-6 text-xs border-b border-slate-200 pb-4">
              {/* Left Side: Client / Bill To Info */}
              <div className="space-y-1 text-left w-1/2">
                <span className="font-bold text-slate-900 block mb-1">
                  {docTitle.includes('Payment-In') || docTitle.includes('Receipt') ? 'Received From' : 'Bill To'}
                </span>
                <p className="font-bold text-slate-900 uppercase text-sm">{clientName}</p>
                {clientAddress && <p className="text-slate-600 leading-tight">{clientAddress}</p>}
                {clientPhone && <p className="text-slate-600">Contact No.: {clientPhone}</p>}
                {(doc?.taxId || clientGstin) && (
                  <p className="text-slate-700 font-semibold">Tax ID / Resale #: {doc?.taxId || clientGstin}</p>
                )}
                <p className="text-slate-600">State: {clientState}</p>
              </div>

              {/* Right Side: Invoice Details */}
              <div className="text-right space-y-1 w-1/2">
                <span className="font-bold text-slate-900 block mb-1">
                  {docTitle} Details
                </span>
                <p><strong>{docTitle} No.:</strong> {doc?.docNumber || doc?.invoiceNumber || doc?.orderId || '1'}</p>
                <p><strong>Date:</strong> {new Date(doc?.createdAt || doc?.date || Date.now()).toLocaleDateString('en-US')}</p>
                <p><strong>Place of Supply:</strong> {clientState}</p>
                {doc?.poNumber && <p><strong>PO Number:</strong> {doc.poNumber}</p>}
                {doc?.poDate && <p><strong>PO Date:</strong> {new Date(doc.poDate).toLocaleDateString('en-US')}</p>}
              </div>
            </div>

            {/* 4. LINE ITEMS TABLE (Purple Accent Header matching PDF Template) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="pdf-header-bg bg-[#8F8DF5] text-white font-bold text-[11px] uppercase">
                    <th className="py-2.5 px-3 border border-slate-300">#</th>
                    <th className="py-2.5 px-3 border border-slate-300">Item Name</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-center">SKU / Code</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-center">Quantity</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-center">Unit</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-right">Price/ Unit</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-center">Sales Tax</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doc?.items && doc.items.length > 0 ? (
                    doc.items.map((item: any, idx: number) => {
                      const qty = item.quantity || 1;
                      const unitPrice = item.price || item.purchasePrice || 0;
                      const lineSubtotal = item.lineSubtotal || qty * unitPrice;
                      const taxRateVal = item.taxRate !== undefined ? Number(item.taxRate) : item.gst !== undefined ? Number(item.gst) : 0;
                      const taxVal = item.lineTax !== undefined ? Number(item.lineTax) : item.lineGst !== undefined ? Number(item.lineGst) : (lineSubtotal * (taxRateVal > 1 ? taxRateVal / 100 : taxRateVal));
                      const lineAmt = item.lineTotal || (lineSubtotal + taxVal);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 border border-slate-200 text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-800">
                            {item.name || item.productName || 'Organic Product Item'}
                            {item.variantName && (
                              <span className="block text-[10px] text-slate-500 font-normal">({item.variantName})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-600 font-mono">
                            {item.sku || item.taxCode || item.hsnCode || 'FLOWER-01'}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center font-bold text-slate-800">{qty}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-600">{item.unit || 'Box'}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-right text-slate-700">{formatCurrency(unitPrice)}</td>
                          <td className="py-2.5 px-3 border border-slate-200 text-center text-slate-600">
                            {formatCurrency(taxVal)}
                            {taxRateVal > 0 && (
                              <span className="block text-[10px] text-slate-400">
                                ({(taxRateVal > 1 ? taxRateVal : taxRateVal * 100).toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border border-slate-200 text-right font-bold text-slate-900">{formatCurrency(lineAmt)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400 italic border border-slate-200">
                        No line items recorded for this invoice.
                      </td>
                    </tr>
                  )}

                  {/* Aggregated Total Row */}
                  <tr className="border-t-2 border-slate-400 font-bold bg-slate-50">
                    <td colSpan={3} className="py-2.5 px-3 border border-slate-300 text-slate-900 font-extrabold">Total</td>
                    <td className="py-2.5 px-3 border border-slate-300 text-center text-slate-900 font-extrabold">
                      {doc?.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0) || 0}
                    </td>
                    <td colSpan={2} className="border border-slate-300"></td>
                    <td className="py-2.5 px-3 border border-slate-300 text-center text-slate-900 font-extrabold">
                      {formatCurrency(Number(doc?.totalTax !== undefined ? doc.totalTax : doc?.totalGst || 0))}
                    </td>
                    <td className="py-2.5 px-3 border border-slate-300 text-right text-slate-900 font-black text-sm">
                      {formatCurrency(grandTotalNum)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. FINANCIAL BREAKDOWN & TERMS SECTION */}
            <div className="pdf-print-grid flex justify-between gap-6 text-xs pt-2">

              {/* Left Column: Words, Terms & Bank Details */}
              <div className="space-y-3 text-left w-1/2">
                <div>
                  <span className="font-bold text-slate-900 block mb-1">Invoice Amount In Words</span>
                  <p className="text-slate-800 italic font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {numberToWords(grandTotalNum)}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Terms And Conditions</span>
                  <p className="text-slate-600">Thank you for doing business with us.</p>
                </div>

                {/* Bank Pay To Details */}
                <div className="pt-2 border-t border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-900 block mb-1">Pay To:</span>
                  {company.bankName && <p className="text-slate-600"><strong>Bank Name:</strong> {company.bankName}</p>}
                  {company.bankAccountNo && <p className="text-slate-600"><strong>Account No.:</strong> {company.bankAccountNo}</p>}
                  {company.bankRoutingNo && <p className="text-slate-600"><strong>Routing No.:</strong> {company.bankRoutingNo}</p>}
                  {company.bankHolder && <p className="text-slate-600"><strong>Account Holder:</strong> {company.bankHolder}</p>}
                  {!company.bankName && !company.bankAccountNo && (
                    <p className="text-slate-600">Online Card / Verified Digital Payment</p>
                  )}
                </div>
              </div>

              {/* Right Column: Calculations Card & Signature */}
              <div className="space-y-4 w-1/2 flex flex-col justify-between">

                <div className="space-y-1 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600 py-0.5">
                    <span>Sub Total</span>
                    <span>{formatCurrency(Number(doc?.subtotal !== undefined ? doc.subtotal : grandTotalNum * 0.95))}</span>
                  </div>
                  {doc?.taxSnapshot?.jurisdictions && doc.taxSnapshot.jurisdictions.length > 0 ? (
                    doc.taxSnapshot.jurisdictions.map((j: any, jIdx: number) => (
                      <div key={jIdx} className="flex justify-between text-slate-600 py-0.5">
                        <span>{j.jurisdictionName} ({(Number(j.rate || 0) * (j.rate < 1 ? 100 : 1)).toFixed(1)}%)</span>
                        <span>{formatCurrency(Number(j.taxAmount || 0))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-slate-600 py-0.5">
                      <span>Sales Tax</span>
                      <span>{formatCurrency(Number(doc?.totalTax !== undefined ? doc.totalTax : doc?.totalGst || 0))}</span>
                    </div>
                  )}

                  {/* Grand Total Bar */}
                  <div className="pdf-header-bg flex justify-between text-sm font-black bg-[#8F8DF5] text-white p-2 rounded-lg my-1.5 shadow-2xs">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotalNum)}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span>Received</span>
                    <span>{formatCurrency(Number(doc?.paidAmount !== undefined ? doc.paidAmount : doc?.received !== undefined ? doc.received : 0))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span>Balance</span>
                    <span>{formatCurrency(Number(doc?.balanceAmount || 0))}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span>Payment Mode</span>
                    <span className="font-semibold">{doc?.paymentMethod || 'Cash'}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span>Current Balance</span>
                    <span>$0.00</span>
                  </div>
                </div>

                {/* Authorized Signatory Block */}
                <div className="text-right pt-2 space-y-6">
                  <p className="font-bold text-slate-800 text-xs">For: {company.name}</p>
                  <div className="inline-block border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-700">
                    Authorized Signatory
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
