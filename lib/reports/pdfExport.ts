import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format currency numbers to 2 decimal places with USD formatting
export const round2 = (val: number | undefined | null) => Math.round((Number(val) || 0) * 100) / 100;

export const formatCurrency = (val: number | undefined | null) => {
  const num = round2(val);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDateTime = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateVal);
  }
};

export const formatDateOnly = (dateVal: string | Date | undefined | null) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateVal);
  }
};

// Corporate Identity Details for Indian-Flowers.com
const COMPANY_NAME = 'INDIAN-FLOWERS.COM';
const COMPANY_SUBTITLE = 'Fresh Indian Garlands, Blooms & Ceremonial Flora — USA';
const COMPANY_ADDRESS = '14922 Bobcat Lane, Fontana, CA 92336, United States';
const COMPANY_CONTACT = 'Phone: +1 (909) 379-3678 | Email: indianflowersorder@gmail.com';

// Theme Colors
const COLOR_BRAND_DARK: [number, number, number] = [11, 59, 36];     // #0B3B24
const COLOR_BRAND_ACCENT: [number, number, number] = [200, 90, 120]; // #C85A78
const COLOR_BRAND_LIGHT: [number, number, number] = [244, 248, 244];  // #F4F8F4
const COLOR_BORDER: [number, number, number] = [229, 231, 235];      // #E5E7EB
const COLOR_TEXT_MUTED: [number, number, number] = [107, 114, 128];  // #6B7280

/**
 * Draw Top Branded Header on First Page
 */
function drawReportHeader(
  doc: jsPDF,
  title: string,
  filterInfo: string,
  orientation: 'portrait' | 'landscape'
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...COLOR_BRAND_DARK);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Company Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLOR_BRAND_DARK);
  doc.text(COMPANY_NAME, 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.text(COMPANY_SUBTITLE, 14, 17.5);

  // 3. Right-Aligned Corporate Address & Contact Info
  doc.setFontSize(7);
  doc.text(COMPANY_ADDRESS, pageWidth - 14, 12.5, { align: 'right' });
  doc.text(COMPANY_CONTACT, pageWidth - 14, 16.5, { align: 'right' });

  // 4. Subtle Divider Line
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, 20.5, pageWidth - 14, 20.5);

  // 5. Document Title Pill / Banner
  doc.setFillColor(...COLOR_BRAND_LIGHT);
  doc.roundedRect(14, 23, pageWidth - 28, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(...COLOR_BRAND_DARK);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 23, pageWidth - 28, 12, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_BRAND_DARK);
  doc.text(title.toUpperCase(), 18, 29);

  // 6. Filter Info & Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.text(filterInfo, 18, 33);

  const nowText = `Generated: ${formatDateTime(new Date())} | All amounts in USD ($)`;
  doc.text(nowText, pageWidth - 18, 31, { align: 'right' });
}

/**
 * Draw 4 KPI Metric Summary Cards
 */
function drawKpiMetricCards(
  doc: jsPDF,
  startY: number,
  cards: { label: string; value: string; isAccent?: boolean }[]
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const availableWidth = pageWidth - margin * 2;
  const cardGap = 3.5;
  const cardWidth = (availableWidth - cardGap * (cards.length - 1)) / cards.length;
  const cardHeight = 13.5;

  cards.forEach((card, idx) => {
    const x = margin + idx * (cardWidth + cardGap);

    // Card background
    doc.setFillColor(252, 253, 252);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(card.label.toUpperCase(), x + 3.5, startY + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    if (card.isAccent) {
      doc.setTextColor(...COLOR_BRAND_ACCENT);
    } else {
      doc.setTextColor(...COLOR_BRAND_DARK);
    }
    doc.text(card.value, x + 3.5, startY + 10.5);
  });
}

/**
 * Configure standard running page headers and footers across all pages
 */
function attachPageNumbersAndRunningHeaders(doc: jsPDF, reportTitle: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Page 2+ Running Header
    if (i > 1) {
      doc.setFillColor(...COLOR_BRAND_DARK);
      doc.rect(0, 0, pageWidth, 2.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_BRAND_DARK);
      doc.text(`${COMPANY_NAME} — ${reportTitle}`, 14, 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLOR_TEXT_MUTED);
      doc.text(`Official Business Audit Record`, pageWidth - 14, 8, { align: 'right' });

      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.2);
      doc.line(14, 9.5, pageWidth - 14, 9.5);
    }

    // Running Footer on every page
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 9, pageWidth - 14, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text('Confidential • Internal Business & Financial Record • Powered by NEXUS CMS Enterprise', 14, pageHeight - 5.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 5.5, { align: 'right' });
  }
}

// ============================================================================
// 1. ORDERS REPORT PDF GENERATOR
// ============================================================================
export interface OrdersPdfFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  orderType?: string;
  refundFilter?: string;
}

export function generateOrdersPDF(orders: any[], filters: OrdersPdfFilters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const filterSummary = `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'} | Status: ${filters.status || 'All'} | Payment: ${filters.paymentStatus || 'All'} | Channel: ${filters.orderType || 'All'}`;
  drawReportHeader(doc, 'Orders & Fulfillment Audit Report', filterSummary, 'landscape');

  // Compute Totals
  let sumSubtotal = 0;
  let sumTax = 0;
  let sumShipping = 0;
  let sumDiscount = 0;
  let sumPointsDiscount = 0;
  let sumTotal = 0;
  let sumRefund = 0;
  let sumNetSettled = 0;

  const tableBody = orders.map((ord) => {
    const items = ord.items || [];
    const itemsSummary = items
      .map((it: any) => `${it.name}${it.variantName ? ` (${it.variantName})` : ''} x${it.quantity}`)
      .join(', ');

    const subtotal = round2(ord.subtotal !== undefined ? ord.subtotal : (ord.totalAmount || 0) - (ord.totalTax || 0));
    const tax = round2(ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0);
    const shipping = round2(ord.shippingFee || ord.deliveryCharge || 0);
    const discount = round2(ord.discountAmount || 0);
    const pointsDiscount = round2(ord.pointsDiscount || 0);
    const total = round2(ord.totalAmount || 0);
    const refund = round2(
      ord.refundAmount !== undefined && ord.refundAmount !== null
        ? ord.refundAmount
        : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
        ? total
        : 0
    );
    const netSettled = round2(Math.max(0, total - refund));

    sumSubtotal += subtotal;
    sumTax += tax;
    sumShipping += shipping;
    sumDiscount += discount;
    sumPointsDiscount += pointsDiscount;
    sumTotal += total;
    sumRefund += refund;
    sumNetSettled += netSettled;

    return [
      ord.orderId || ord._id,
      ord.orderType === 'POS' ? 'POS Counter' : 'Online Store',
      formatDateOnly(ord.createdAt),
      ord.customerName || 'N/A',
      `${ord.city || ''}, ${ord.state || ''}`,
      itemsSummary,
      formatCurrency(subtotal),
      formatCurrency(tax),
      formatCurrency(shipping),
      discount > 0 ? `-${formatCurrency(discount)}` : '$0.00',
      pointsDiscount > 0 ? `-${formatCurrency(pointsDiscount)}` : '$0.00',
      formatCurrency(total),
      refund > 0 ? `-${formatCurrency(refund)}` : '$0.00',
      formatCurrency(netSettled),
      ord.paymentStatus || 'Pending',
      ord.status || 'Pending',
    ];
  });

  // KPI Stat Cards on Page 1
  drawKpiMetricCards(doc, 37.5, [
    { label: 'Total Orders', value: String(orders.length) },
    { label: 'Gross Revenue', value: formatCurrency(sumTotal) },
    { label: 'Sales Tax Collected', value: formatCurrency(sumTax) },
    { label: 'Refunds Deducted', value: formatCurrency(sumRefund), isAccent: sumRefund > 0 },
    { label: 'Net Settled Revenue', value: formatCurrency(sumNetSettled) },
  ]);

  // Orders Table
  autoTable(doc, {
    startY: 53.5,
    margin: { left: 14, right: 14, top: 14, bottom: 12 },
    head: [[
      'Order ID',
      'Channel',
      'Date',
      'Customer',
      'Location',
      'Items Ordered',
      'Subtotal',
      'Tax',
      'Ship',
      'Promo',
      'Points',
      'Total',
      'Refund',
      'Net Settled',
      'Payment',
      'Fulfillment',
    ]],
    body: tableBody,
    foot: [[
      `TOTALS (${orders.length})`,
      '',
      '',
      '',
      '',
      '',
      formatCurrency(sumSubtotal),
      formatCurrency(sumTax),
      formatCurrency(sumShipping),
      `-${formatCurrency(sumDiscount)}`,
      `-${formatCurrency(sumPointsDiscount)}`,
      formatCurrency(sumTotal),
      `-${formatCurrency(sumRefund)}`,
      formatCurrency(sumNetSettled),
      '',
      '',
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLOR_BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 252, 250],
    },
    footStyles: {
      fillColor: [230, 244, 234],
      textColor: COLOR_BRAND_DARK,
      fontStyle: 'bold',
      fontSize: 6.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right' },
      11: { halign: 'right', fontStyle: 'bold' },
      12: { halign: 'right' },
      13: { halign: 'right', fontStyle: 'bold' },
      14: { halign: 'center' },
      15: { halign: 'center' },
    },
  });

  attachPageNumbersAndRunningHeaders(doc, 'Orders & Fulfillment Audit Report');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    doc,
    filename: `IndianFlowers_Orders_Report_${filenameDate}.pdf`,
  };
}

// ============================================================================
// 2. PAYMENTS REPORT PDF GENERATOR
// ============================================================================
export interface PaymentsPdfFilters {
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  orderType?: string;
  refundFilter?: string;
}

export function generatePaymentsPDF(orders: any[], filters: PaymentsPdfFilters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const filterSummary = `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'} | Status: ${filters.paymentStatus || 'All'} | Method: ${filters.paymentMethod || 'All'} | Channel: ${filters.orderType || 'All'}`;
  drawReportHeader(doc, 'Payments Audit & Settlement Report', filterSummary, 'landscape');

  let sumGross = 0;
  let sumPointsDisc = 0;
  let sumTax = 0;
  let sumRefund = 0;
  let sumNet = 0;

  const tableBody = orders.map((ord) => {
    const gross = round2(ord.totalAmount || 0);
    const pointsDisc = round2(ord.pointsDiscount || 0);
    const tax = round2(ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0);
    const refund = round2(
      ord.refundAmount !== undefined && ord.refundAmount !== null
        ? ord.refundAmount
        : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
        ? gross
        : 0
    );
    const net = round2(Math.max(0, gross - refund));

    sumGross += gross;
    sumPointsDisc += pointsDisc;
    sumTax += tax;
    sumRefund += refund;
    sumNet += net;

    return [
      ord.transactionId || ord.invoiceNumber || ord.orderId || 'N/A',
      ord.orderId || ord._id,
      formatDateTime(ord.createdAt),
      ord.customerName || 'N/A',
      ord.paymentMethod || 'N/A',
      ord.paymentStatus || 'Pending',
      formatCurrency(gross),
      pointsDisc > 0 ? `-${formatCurrency(pointsDisc)}` : '$0.00',
      formatCurrency(tax),
      refund > 0 ? `-${formatCurrency(refund)}` : '$0.00',
      formatCurrency(net),
      ord.orderType === 'POS' ? 'POS Counter' : 'Online Store',
      ord.status || 'Pending',
    ];
  });

  drawKpiMetricCards(doc, 37.5, [
    { label: 'Total Transactions', value: String(orders.length) },
    { label: 'Gross Inflow', value: formatCurrency(sumGross) },
    { label: 'Tax Liabilities', value: formatCurrency(sumTax) },
    { label: 'Total Refunds', value: formatCurrency(sumRefund), isAccent: sumRefund > 0 },
    { label: 'Net Retained Inflow', value: formatCurrency(sumNet) },
  ]);

  autoTable(doc, {
    startY: 53.5,
    margin: { left: 14, right: 14, top: 14, bottom: 12 },
    head: [[
      'Transaction Ref / ID',
      'Order ID',
      'Transaction Date & Time',
      'Customer Name',
      'Method',
      'Payment Status',
      'Gross Amount',
      'Points Disc',
      'Tax Liab.',
      'Refund Deduct',
      'Net Settled',
      'Channel',
      'Order Status',
    ]],
    body: tableBody,
    foot: [[
      `TOTALS (${orders.length})`,
      '',
      '',
      '',
      '',
      '',
      formatCurrency(sumGross),
      `-${formatCurrency(sumPointsDisc)}`,
      formatCurrency(sumTax),
      `-${formatCurrency(sumRefund)}`,
      formatCurrency(sumNet),
      '',
      '',
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: COLOR_BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 252, 250],
    },
    footStyles: {
      fillColor: [230, 244, 234],
      textColor: COLOR_BRAND_DARK,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold' },
      11: { halign: 'center' },
      12: { halign: 'center' },
    },
  });

  attachPageNumbersAndRunningHeaders(doc, 'Payments Audit & Settlement Report');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    doc,
    filename: `IndianFlowers_Payments_Report_${filenameDate}.pdf`,
  };
}

// ============================================================================
// 3. CUSTOMERS REPORT PDF GENERATOR
// ============================================================================
export interface CustomersPdfFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  state?: string;
}

export function generateCustomersPDF(customers: any[], filters: CustomersPdfFilters = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const filterSummary = `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'} | Status: ${filters.status || 'All'} | State: ${filters.state || 'All 50 US States'}`;
  drawReportHeader(doc, 'Registered Customers & Loyalty Analytics Report', filterSummary, 'landscape');

  let sumOrders = 0;
  let sumSpend = 0;
  let sumPointsBalance = 0;
  let sumPointsEarned = 0;

  const tableBody = customers.map((c) => {
    const ordersCount = Number(c.totalOrders) || (c.orders ? c.orders.length : 0);
    const spend = round2(c.totalSpent || 0);
    const aov = ordersCount > 0 ? round2(spend / ordersCount) : 0;
    const pointsBalance = Number(c.pointsBalance) || 0;
    const pointsEarned = Number(c.totalPointsEarned) || 0;

    sumOrders += ordersCount;
    sumSpend += spend;
    sumPointsBalance += pointsBalance;
    sumPointsEarned += pointsEarned;

    return [
      c._id,
      c.name || 'N/A',
      c.email || '',
      c.phone || '',
      `${c.city || ''}, ${c.state || ''} ${c.zipCode || ''}`,
      c.isActive !== false ? 'Active' : 'Suspended',
      formatDateOnly(c.createdAt),
      pointsBalance.toLocaleString(),
      pointsEarned.toLocaleString(),
      ordersCount,
      formatCurrency(spend),
      formatCurrency(aov),
      c.lastOrderDate ? formatDateOnly(c.lastOrderDate) : 'No Orders',
    ];
  });

  const overallAOV = sumOrders > 0 ? round2(sumSpend / sumOrders) : 0;

  drawKpiMetricCards(doc, 37.5, [
    { label: 'Registered Customers', value: String(customers.length) },
    { label: 'Total Orders Placed', value: String(sumOrders) },
    { label: 'Cumulative Spend', value: formatCurrency(sumSpend) },
    { label: 'Average Order Value', value: formatCurrency(overallAOV) },
    { label: 'Active Loyalty Points', value: sumPointsBalance.toLocaleString() },
  ]);

  autoTable(doc, {
    startY: 53.5,
    margin: { left: 14, right: 14, top: 14, bottom: 12 },
    head: [[
      'Customer ID',
      'Customer Name',
      'Email Address',
      'Phone Number',
      'Location (City, State, ZIP)',
      'Status',
      'Joined',
      'Points Bal.',
      'Pts Earned',
      'Orders',
      'Total Spend',
      'Avg Order Value',
      'Last Order',
    ]],
    body: tableBody,
    foot: [[
      `TOTALS (${customers.length})`,
      '',
      '',
      '',
      '',
      '',
      '',
      sumPointsBalance.toLocaleString(),
      sumPointsEarned.toLocaleString(),
      sumOrders,
      formatCurrency(sumSpend),
      formatCurrency(overallAOV),
      '',
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: COLOR_BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [250, 252, 250],
    },
    footStyles: {
      fillColor: [230, 244, 234],
      textColor: COLOR_BRAND_DARK,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'center' },
      10: { halign: 'right', fontStyle: 'bold' },
      11: { halign: 'right' },
      12: { halign: 'center' },
    },
  });

  attachPageNumbersAndRunningHeaders(doc, 'Registered Customers & Loyalty Analytics Report');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    doc,
    filename: `IndianFlowers_Customers_Report_${filenameDate}.pdf`,
  };
}

// ============================================================================
// 4. PROFIT & LOSS (P&L) STATEMENT PDF GENERATOR
// ============================================================================
export interface PnLPdfFilters {
  startDate?: string;
  endDate?: string;
}

export function generatePnLPDF(pnlData: any, rawData?: { expenses?: any[]; purchases?: any[] }, filters: PnLPdfFilters = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const periodSummary = `Reporting Period: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'} | Currency: US Dollars (USD $) strictly`;
  drawReportHeader(doc, 'Official Profit & Loss (P&L) Statement', periodSummary, 'portrait');

  // Calculations
  const grossRev = round2(pnlData.grossSalesRevenue || 0);
  const onlineRev = round2(pnlData.onlineStoreSales || 0);
  const posRev = round2(pnlData.posCounterSales || 0);
  const b2bRev = pnlData.b2bSaleInvoices !== undefined ? round2(pnlData.b2bSaleInvoices) : round2(Math.max(0, grossRev - onlineRev - posRev));
  const returns = round2(pnlData.salesReturnTotal || 0);
  const loyaltyPointsDiscount = round2(pnlData.loyaltyPointsDiscountTotal || 0);
  const netRev = round2(pnlData.netSalesRevenue || 0);

  const purchaseBills = round2(pnlData.purchaseBillTotal || 0);
  const purchaseReturns = round2(pnlData.purchaseReturnTotal || 0);
  const cogs = round2(pnlData.costOfGoodsSold || 0);

  const grossProfit = round2(pnlData.grossProfit || 0);
  const grossMargin = netRev > 0 ? Math.round((grossProfit / netRev) * 1000) / 10 : 0;

  const totalExp = round2(pnlData.totalExpenses || 0);
  const netProfit = round2(pnlData.netProfit || 0);
  const netMargin = netRev > 0 ? Math.round((netProfit / netRev) * 1000) / 10 : 0;
  const isProfit = pnlData.isProfit !== undefined ? pnlData.isProfit : netProfit >= 0;

  const taxCollected = round2(pnlData.salesTaxCollected || pnlData.salesTaxPayable || 0);

  // Executive KPI Stat Cards
  drawKpiMetricCards(doc, 37.5, [
    { label: 'Net Sales Revenue', value: formatCurrency(netRev) },
    { label: 'Cost of Goods Sold', value: formatCurrency(cogs) },
    { label: 'Operating Expenses', value: formatCurrency(totalExp) },
    { label: isProfit ? 'Net Operating Profit' : 'Net Operating Loss', value: formatCurrency(netProfit), isAccent: !isProfit },
  ]);

  // Structured Financial Ledger Rows
  const ledgerRows: any[] = [
    // 1. REVENUE
    [{ content: '1. OPERATIONAL SALES REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 246, 242] } }, ''],
    ['   • Online Storefront Sales (Verified Delivered/Paid)', formatCurrency(onlineRev)],
    ['   • In-Store POS Sales (Verified Paid)', formatCurrency(posRev)],
    ['   • B2B Wholesale / Corporate Invoices', formatCurrency(b2bRev >= 0 ? b2bRev : 0)],
    [{ content: '   GROSS OPERATING REVENUE', styles: { fontStyle: 'bold' } }, { content: formatCurrency(grossRev), styles: { fontStyle: 'bold' } }],
    ['   Less: Customer Returns & Itemized Refunds', `-${formatCurrency(returns)}`],
  ];

  if (loyaltyPointsDiscount > 0) {
    ledgerRows.push(['   Less: Loyalty Points Redemption Discounts Claimed', `-${formatCurrency(loyaltyPointsDiscount)}`]);
  }

  ledgerRows.push(
    [{ content: '   NET SALES REVENUE', styles: { fontStyle: 'bold', textColor: COLOR_BRAND_DARK } }, { content: formatCurrency(netRev), styles: { fontStyle: 'bold', textColor: COLOR_BRAND_DARK } }],
    // 2. COGS
    [{ content: '2. COST OF GOODS SOLD (COGS) & INVENTORY RESTOCKING', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 246, 242] } }, ''],
    ['   • Fresh Flower Vendor Purchases (Purchase Bills)', formatCurrency(purchaseBills)],
    ['   Less: Vendor Returns & Restocking Credits', `-${formatCurrency(purchaseReturns)}`],
    [{ content: '   TOTAL COST OF GOODS SOLD (COGS)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(cogs), styles: { fontStyle: 'bold' } }],
    // 3. GROSS PROFIT
    [{ content: '3. GROSS OPERATING PROFIT', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 246, 242] } }, ''],
    [{ content: '   GROSS PROFIT (Net Sales Revenue − COGS)', styles: { fontStyle: 'bold', textColor: COLOR_BRAND_DARK } }, { content: formatCurrency(grossProfit), styles: { fontStyle: 'bold', textColor: COLOR_BRAND_DARK } }],
    ['   Gross Profit Margin (%)', `${grossMargin}%`],
    // 4. OPERATING EXPENSES
    [{ content: '4. OPERATING EXPENSES (Overheads & Logistics)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 246, 242] } }, '']
  );

  const expensesList: { category: string; amount: number }[] = pnlData.expenseByCategory || [];
  if (expensesList.length === 0) {
    ledgerRows.push(['   • No Operating Expenses Logged in Period', '$0.00']);
  } else {
    expensesList.forEach((exp) => {
      ledgerRows.push([`   • ${exp.category}`, formatCurrency(exp.amount)]);
    });
  }

  ledgerRows.push(
    [{ content: '   TOTAL OPERATING EXPENSES', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalExp), styles: { fontStyle: 'bold' } }],
    // 5. NET PROFIT / LOSS
    [{ content: '5. NET BUSINESS FINANCIAL RESULT', colSpan: 2, styles: { fontStyle: 'bold', fillColor: isProfit ? [230, 244, 234] : [254, 237, 240] } }, ''],
    [{ content: '   FINAL NET OPERATING PROFIT / (LOSS)', styles: { fontStyle: 'bold', fontSize: 8.5, textColor: isProfit ? COLOR_BRAND_DARK : COLOR_BRAND_ACCENT } }, { content: formatCurrency(netProfit), styles: { fontStyle: 'bold', fontSize: 8.5, textColor: isProfit ? COLOR_BRAND_DARK : COLOR_BRAND_ACCENT } }],
    ['   Net Operating Profit Margin (%)', `${netMargin}%`],
    ['   Executive Financial Standing', isProfit ? 'PROFITABLE (POSITIVE NET INCOME)' : 'NET OPERATING DEFICIT'],
    // 6. TAX LIABILITIES
    [{ content: '6. STATUTORY US SALES TAX LIABILITIES (Fiduciary Custody)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 246, 242] } }, ''],
    ['   US State & District Sales Tax Collected from Customers', formatCurrency(taxCollected)],
    ['   Sales Tax Payable (Separated from operational business earnings)', formatCurrency(taxCollected)]
  );

  autoTable(doc, {
    startY: 53.5,
    margin: { left: 14, right: 14, top: 14, bottom: 12 },
    head: [['Financial Account / Audit Line Item', 'Amount ($ USD)']],
    body: ledgerRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [17, 24, 39],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: COLOR_BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 42, halign: 'right' },
    },
  });

  // Optional Second Page: Itemized Expenses Ledger (if any)
  if (rawData?.expenses && rawData.expenses.length > 0) {
    const expRows = rawData.expenses.map((exp: any) => [
      exp.voucherNo || exp.expenseNumber || 'EXP',
      formatDateOnly(exp.date || exp.createdAt),
      exp.category || 'General',
      exp.payeeName || exp.paidTo || 'N/A',
      exp.paymentMode || exp.paymentMethod || 'Cash',
      exp.notes || exp.description || '-',
      formatCurrency(exp.amount),
    ]);

    autoTable(doc, {
      margin: { left: 14, right: 14, top: 14, bottom: 12 },
      pageBreak: 'auto',
      head: [[
        'Voucher #',
        'Date',
        'Category',
        'Paid To / Vendor',
        'Payment Mode',
        'Description / Notes',
        'Amount ($ USD)',
      ]],
      body: expRows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: [17, 24, 39],
        lineColor: [229, 231, 235],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: COLOR_BRAND_DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
        4: { cellWidth: 20 },
        5: { cellWidth: 32 },
        6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  attachPageNumbersAndRunningHeaders(doc, 'Profit & Loss (P&L) Statement');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    doc,
    filename: `IndianFlowers_PnL_Statement_${filenameDate}.pdf`,
  };
}

/**
 * Convert jsPDF document to Buffer (for server response)
 */
export function pdfToBuffer(doc: jsPDF): Buffer {
  const arrayBuf = doc.output('arraybuffer');
  return Buffer.from(arrayBuf);
}
