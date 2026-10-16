'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { getCompanyConfig } from '@/lib/companyConfig';
import { formatCurrency } from '@/lib/currency';

interface PrintablePnLModalProps {
  report: any;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export default function PrintablePnLModal({
  report,
  startDate,
  endDate,
  onClose,
}: PrintablePnLModalProps) {
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
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPeriodText = () => {
    if (startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    if (startDate) return `From ${startDate} onwards`;
    if (endDate) return `Up to ${endDate}`;
    return 'All-Time Financial Performance Record';
  };

  return (
    <div
      id="pnl-printable-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-hidden print:p-0 print:bg-white print:overflow-visible"
    >
      {/* CSS Print Styles for Full A4 P&L Report */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4 portrait;
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
          #pnl-printable-modal-backdrop,
          #pnl-printable-modal-dialog,
          #pnl-printable-modal-canvas {
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
          #pnl-printable-document-area,
          #pnl-printable-document-area * {
            visibility: visible !important;
          }

          /* POSITION PDF TEMPLATE AT ABSOLUTE TOP OF PAGE 1 WITHOUT CLIPPING */
          #pnl-printable-document-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm 15mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 12px !important;
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
        }
      `}</style>

      <div
        id="pnl-printable-modal-dialog"
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-[#E8EDF2] shadow-2xl relative print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-full print:max-h-none overflow-hidden"
      >
        {/* Sticky Control Header Bar */}
        <div className="print-control-bar p-4 sm:p-5 border-b border-[#E8EDF2] flex items-center justify-between shrink-0 bg-white print:hidden z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8F8DF5]/15 text-[#7B78ED] flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#163B5C]">
                Profit & Loss Financial Statement Export
              </h3>
              <p className="text-xs text-[#64748B]">Formal A4 Enterprise Report • {getPeriodText()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#7B78ED] hover:bg-[#6865D8] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#7B78ED]/20"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#64748B]">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas Wrapper */}
        <div
          id="pnl-printable-modal-canvas"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible"
        >
          {/* Printable Formal P&L Document Container */}
          <div
            id="pnl-printable-document-area"
            className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-xl border border-gray-200 shadow-md space-y-6 text-xs sm:text-sm text-slate-800 print:border-none print:shadow-none print:p-0 print:max-w-full"
          >
            {/* 1. Header Section (Matching Sales/Invoice PDF Header) */}
            <div className="pdf-print-flex flex justify-between items-start border-b-2 border-[#8F8DF5] pb-4">
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

            {/* 2. Statement Title & Period */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 my-2">
              <div>
                <h2 className="font-serif font-bold text-xl text-[#7B78ED] uppercase tracking-wider">
                  STATEMENT OF PROFIT & LOSS
                </h2>
                <span className="text-xs font-semibold text-slate-600 block">
                  Accounting Period: <strong className="text-slate-900">{getPeriodText()}</strong>
                </span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Statement Generated: <strong>{new Date().toLocaleDateString('en-US')}</strong></div>
                <div>System: <strong>{company.name} Enterprise Accounting</strong></div>
              </div>
            </div>

            {/* 3. Net Result Highlight Summary */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${report.isProfit
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
            >
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider block opacity-75">
                  NET BUSINESS FINANCIAL PERFORMANCE RESULT
                </span>
                <span className="text-2xl font-black">
                  {report.isProfit ? '+' : '-'} {formatCurrency(Math.abs(report.netProfit || 0))}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white border border-current">
                {report.isProfit ? '🎉 NET PROFIT EARNED' : '⚠️ NET LOSS RECORDED'}
              </span>
            </div>

            {/* 4. Formal Financial Breakdown Table */}
            <div className="space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 border-b pb-1">
                1. FINANCIAL BREAKDOWN SUMMARY
              </h3>

              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-[#8F8DF5] text-white font-bold uppercase text-[11px]">
                    <th className="p-2.5 border border-slate-300">Financial Particulars</th>
                    <th className="p-2.5 text-right border border-slate-300">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* 1. REVENUE */}
                  <tr className="bg-slate-50">
                    <td className="p-2.5 font-extrabold text-slate-900 uppercase border border-slate-200" colSpan={2}>
                      A. REVENUE FROM OPERATIONS (GROSS SALES)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700 border border-slate-200">Online E-Commerce Sales Revenue</td>
                    <td className="p-2.5 text-right font-semibold text-slate-900 border border-slate-200">
                      {formatCurrency(report.onlineStoreSales)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700 border border-slate-200">POS Counter Billing Sales Revenue</td>
                    <td className="p-2.5 text-right font-semibold text-slate-900 border border-slate-200">
                      {formatCurrency(report.posCounterSales)}
                    </td>
                  </tr>
                  <tr className="text-rose-600">
                    <td className="p-2.5 pl-6 border border-slate-200">Less: Sales Returns & Credit Notes Issued</td>
                    <td className="p-2.5 text-right font-semibold border border-slate-200">
                      - {formatCurrency(report.salesReturnTotal)}
                    </td>
                  </tr>
                  <tr className="font-black bg-emerald-50 border-t-2 border-slate-300">
                    <td className="p-2.5 text-slate-900 border border-slate-200">NET SALES REVENUE (GROSS INCOME)</td>
                    <td className="p-2.5 text-right text-emerald-800 text-sm border border-slate-200">
                      {formatCurrency(report.netSalesRevenue)}
                    </td>
                  </tr>

                  {/* 2. COGS */}
                  <tr className="bg-slate-50">
                    <td className="p-2.5 font-extrabold text-slate-900 uppercase border border-slate-200" colSpan={2}>
                      B. COST OF GOODS SOLD (COGS)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-700 border border-slate-200">Inward Inventory Purchase Bills</td>
                    <td className="p-2.5 text-right font-semibold text-slate-900 border border-slate-200">
                      {formatCurrency(report.purchaseBillTotal)}
                    </td>
                  </tr>
                  <tr className="text-emerald-600">
                    <td className="p-2.5 pl-6 border border-slate-200">Less: Purchase Returns to Vendors</td>
                    <td className="p-2.5 text-right font-semibold border border-slate-200">
                      - {formatCurrency(report.purchaseReturnTotal)}
                    </td>
                  </tr>
                  <tr className="font-bold border-t">
                    <td className="p-2.5 text-slate-900 border border-slate-200">TOTAL COST OF GOODS SOLD (COGS)</td>
                    <td className="p-2.5 text-right font-extrabold text-slate-900 border border-slate-200">
                      {formatCurrency(report.costOfGoodsSold)}
                    </td>
                  </tr>
                  <tr className="font-black bg-slate-100 border-t-2 border-slate-300">
                    <td className="p-2.5 text-slate-900 border border-slate-200">GROSS PROFIT (NET SALES - COGS)</td>
                    <td className="p-2.5 text-right text-slate-900 text-sm border border-slate-200">
                      {formatCurrency(report.grossProfit)}
                    </td>
                  </tr>

                  {/* 3. EXPENSES */}
                  <tr className="bg-slate-50">
                    <td className="p-2.5 font-extrabold text-slate-900 uppercase border border-slate-200" colSpan={2}>
                      C. OPERATING & ADMINISTRATIVE EXPENSES
                    </td>
                  </tr>
                  {report.expenseByCategory?.length === 0 ? (
                    <tr>
                      <td className="p-2.5 pl-6 italic text-slate-400 border border-slate-200" colSpan={2}>
                        No operating expenses logged in period
                      </td>
                    </tr>
                  ) : (
                    report.expenseByCategory?.map((cat: any) => (
                      <tr key={cat.category}>
                        <td className="p-2.5 pl-6 text-slate-700 border border-slate-200">{cat.category}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-900 border border-slate-200">
                          {formatCurrency(cat.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="font-bold text-rose-700 bg-rose-50/50 border-t-2 border-slate-300">
                    <td className="p-2.5 border border-slate-200">TOTAL OPERATING EXPENSES</td>
                    <td className="p-2.5 text-right font-extrabold border border-slate-200">
                      {formatCurrency(report.totalExpenses)}
                    </td>
                  </tr>

                  {/* 4. NET PROFIT */}
                  <tr className="font-black bg-slate-900 text-white text-sm">
                    <td className="p-3 uppercase">NET FINANCIAL RESULT (GROSS PROFIT - EXPENSES)</td>
                    <td className={`p-3 text-right ${report.isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {report.isProfit ? '+' : '-'} {formatCurrency(Math.abs(report.netProfit || 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. US Sales Tax Liability Table */}
            <div className="space-y-3 pt-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 border-b pb-1">
                2. US SALES TAX LIABILITY SUMMARY
              </h3>

              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-700">
                    <th className="p-2.5 border border-slate-300">Sales Tax Parameter</th>
                    <th className="p-2.5 text-right border border-slate-300">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 text-slate-700 border border-slate-200">Total Sales Tax Collected on Customer Sales</td>
                    <td className="p-2.5 text-right font-bold text-amber-800 border border-slate-200">
                      {formatCurrency(report.salesTaxCollected ?? report.outputGstCollected ?? 0)}
                    </td>
                  </tr>
                  <tr className="font-black bg-amber-50 text-slate-900 border-t-2 border-amber-300">
                    <td className="p-2.5 border border-slate-200">TOTAL SALES TAX PAYABLE TO STATE & LOCAL JURISDICTIONS</td>
                    <td className="p-2.5 text-right text-amber-900 text-sm border border-slate-200">
                      {formatCurrency(report.salesTaxPayable ?? report.netGstPayable ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[10px] text-slate-500 italic">
                * Note: Sales tax collected is a fiduciary liability held in trust for state and local tax authorities and is excluded from operational net sales revenue.
              </p>
            </div>

            {/* 6. Footer Signoff */}
            <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">
                  {company.name}{company.ein ? ` | EIN: ${company.ein}` : ''}
                </p>
                <p className="text-[10px] text-slate-500">This is an official computer-generated financial report statement.</p>
              </div>
              <div className="text-right space-y-6">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Authorized Financial Signatory</div>
                <div className="border-t border-slate-400 pt-1 text-[10px] italic text-slate-600">Signature & Company Seal</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
