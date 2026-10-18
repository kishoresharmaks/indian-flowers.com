import * as XLSX from 'xlsx';

// Helper to format currency numbers to 2 decimal places
const round2 = (val: number | undefined | null) => Math.round((Number(val) || 0) * 100) / 100;

// Helper to format date strings
const formatDateTime = (dateVal: string | Date | undefined | null) => {
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

const formatDateOnly = (dateVal: string | Date | undefined | null) => {
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

// ============================================================================
// 1. ORDERS REPORT EXCEL GENERATOR
// ============================================================================
export interface OrdersExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  orderType?: string;
  refundFilter?: string;
}

export function generateOrdersWorkbook(orders: any[], filters: OrdersExportFilters = {}) {
  const wb = XLSX.utils.book_new();
  const nowStr = formatDateTime(new Date());

  const filterSummary = [
    `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'}`,
    `Order Status: ${filters.status || 'All'}`,
    `Payment Status: ${filters.paymentStatus || 'All'}`,
    `Refund Filter: ${
      filters.refundFilter
        ? filters.refundFilter === 'REFUNDED_ONLY'
          ? 'Refunded Orders Only'
          : filters.refundFilter === 'EXCLUDE_REFUNDS'
          ? 'Exclude Refunds'
          : filters.refundFilter
        : 'All'
    }`,
    `Channel: ${filters.orderType || 'All'}`,
    `Generated On: ${nowStr} (US Eastern Time)`,
  ].join(' | ');

  // Sheet 1: Orders Master List
  const masterHeader = [
    ['INDIAN-FLOWERS.COM — ORDERS & FULFILLMENT REPORT'],
    [filterSummary],
    ['All amounts displayed in US Dollars (USD $) strictly.'],
    [], // Blank separator
    [
      'Order ID',
      'Channel',
      'Placed Date & Time',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Delivery Address',
      'City',
      'State',
      'District / County',
      'ZIP Code',
      'Items Count',
      'Items Summary',
      'Subtotal ($)',
      'Sales Tax ($)',
      'Shipping Fee ($)',
      'Discount ($)',
      'Total Amount ($)',
      'Refund Amount ($)',
      'Net Settled ($)',
      'Refund Reason',
      'Refund Date',
      'Restocked',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status',
      'Transaction Ref / ID',
    ],
  ];

  let sumSubtotal = 0;
  let sumTax = 0;
  let sumShipping = 0;
  let sumDiscount = 0;
  let sumTotal = 0;
  let sumRefund = 0;
  let sumNetSettled = 0;
  let totalUnits = 0;

  const masterRows = orders.map((ord) => {
    const items = ord.items || [];
    const units = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    const itemsSummary = items
      .map((it: any) => `${it.name}${it.variantName ? ` (${it.variantName})` : ''} x${it.quantity}`)
      .join('; ');

    const subtotal = round2(ord.subtotal !== undefined ? ord.subtotal : (ord.totalAmount || 0) - (ord.totalTax || 0));
    const tax = round2(ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0);
    const shipping = round2(ord.shippingFee || ord.deliveryCharge || 0);
    const discount = round2(ord.discountAmount || 0);
    const total = round2(ord.totalAmount || 0);
    const refund = round2(
      ord.refundAmount !== undefined && ord.refundAmount !== null
        ? ord.refundAmount
        : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
        ? total
        : 0
    );
    const netSettled = round2(Math.max(0, total - refund));
    const refundReason = ord.refundReason || (refund > 0 ? 'Refund processed' : '-');
    const refundDate = ord.refundDate
      ? formatDateTime(ord.refundDate)
      : refund > 0 && ord.updatedAt
      ? formatDateTime(ord.updatedAt)
      : '-';
    const restocked = ord.isRestocked ? 'Yes (Restocked)' : refund > 0 ? 'No' : '-';

    sumSubtotal += subtotal;
    sumTax += tax;
    sumShipping += shipping;
    sumDiscount += discount;
    sumTotal += total;
    sumRefund += refund;
    sumNetSettled += netSettled;
    totalUnits += units;

    return [
      ord.orderId || ord._id,
      ord.orderType === 'POS' ? 'POS Counter' : 'Online Store',
      formatDateTime(ord.createdAt),
      ord.customerName || 'N/A',
      ord.customerEmail || '',
      ord.customerPhone || '',
      ord.streetAddress || ord.shippingAddress || '',
      ord.city || '',
      ord.state || '',
      ord.district || '',
      ord.zipCode || ord.pincode || '',
      units,
      itemsSummary,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      refund,
      netSettled,
      refundReason,
      refundDate,
      restocked,
      ord.paymentMethod || 'N/A',
      ord.paymentStatus || 'Pending',
      ord.status || 'Pending',
      ord.transactionId || ord.invoiceNumber || '',
    ];
  });

  // Summary Row at the bottom
  const summaryRow = [
    `TOTALS (${orders.length} Orders)`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalUnits,
    '',
    round2(sumSubtotal),
    round2(sumTax),
    round2(sumShipping),
    round2(sumDiscount),
    round2(sumTotal),
    round2(sumRefund),
    round2(sumNetSettled),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];

  const sheet1Data = [...masterHeader, ...masterRows, [], summaryRow];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Column Widths for readability
  ws1['!cols'] = [
    { wch: 16 }, // Order ID
    { wch: 14 }, // Channel
    { wch: 22 }, // Placed Date
    { wch: 24 }, // Customer Name
    { wch: 26 }, // Email
    { wch: 16 }, // Phone
    { wch: 32 }, // Address
    { wch: 16 }, // City
    { wch: 8 },  // State
    { wch: 16 }, // District
    { wch: 10 }, // ZIP
    { wch: 12 }, // Units
    { wch: 45 }, // Items Summary
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Sales Tax
    { wch: 14 }, // Shipping
    { wch: 14 }, // Discount
    { wch: 16 }, // Total Amount
    { wch: 16 }, // Refund Amount
    { wch: 16 }, // Net Settled
    { wch: 28 }, // Refund Reason
    { wch: 22 }, // Refund Date
    { wch: 16 }, // Restocked
    { wch: 16 }, // Payment Method
    { wch: 16 }, // Payment Status
    { wch: 18 }, // Fulfillment Status
    { wch: 22 }, // Transaction Ref
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Orders Master List');

  // Sheet 2: Itemized Line Items Breakdown
  const lineItemHeader = [
    ['INDIAN-FLOWERS.COM — ITEMIZED ORDER LINE ITEMS BREAKDOWN'],
    [`Generated On: ${nowStr} | Total Orders Evaluated: ${orders.length}`],
    [],
    [
      'Order ID',
      'Order Placed Date',
      'Channel',
      'Customer Name',
      'Product Name',
      'Variant',
      'Quantity Ordered',
      'Unit Price ($)',
      'Line Total ($)',
      'Taxable',
      'Refund Status',
      'Payment Status',
      'Order Status',
    ],
  ];

  const lineItemRows: any[] = [];
  orders.forEach((ord) => {
    const refundTag =
      ord.refundAmount && ord.refundAmount > 0
        ? ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
          ? 'Full Refund'
          : 'Partial Refund'
        : ord.status === 'Refunded'
        ? 'Refunded'
        : ord.status === 'Returned'
        ? 'Returned'
        : 'None';

    (ord.items || []).forEach((it: any) => {
      const unitPrice = round2(it.price || 0);
      const qty = Number(it.quantity) || 1;
      const lineTotal = round2(unitPrice * qty);
      lineItemRows.push([
        ord.orderId || ord._id,
        formatDateTime(ord.createdAt),
        ord.orderType === 'POS' ? 'POS Counter' : 'Online Store',
        ord.customerName || 'N/A',
        it.name || 'Product',
        it.variantName || 'Standard',
        qty,
        unitPrice,
        lineTotal,
        it.isTaxable !== false ? 'Yes' : 'No',
        refundTag,
        ord.paymentStatus || 'Pending',
        ord.status || 'Pending',
      ]);
    });
  });

  const ws2 = XLSX.utils.aoa_to_sheet([...lineItemHeader, ...lineItemRows]);
  ws2['!cols'] = [
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 24 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 }, // Refund Status
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Itemized Line Items');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    workbook: wb,
    filename: `IndianFlowers_Orders_Report_${filenameDate}.xlsx`,
  };
}

// ============================================================================
// 2. PAYMENTS REPORT EXCEL GENERATOR
// ============================================================================
export interface PaymentsExportFilters {
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  orderType?: string;
  refundFilter?: string;
}

export function generatePaymentsWorkbook(orders: any[], filters: PaymentsExportFilters = {}) {
  const wb = XLSX.utils.book_new();
  const nowStr = formatDateTime(new Date());

  const filterSummary = [
    `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'}`,
    `Payment Status: ${filters.paymentStatus || 'All'}`,
    `Refund Filter: ${
      filters.refundFilter
        ? filters.refundFilter === 'REFUNDED_ONLY'
          ? 'Refunded Payments Only'
          : filters.refundFilter === 'EXCLUDE_REFUNDS'
          ? 'Exclude Refunds'
          : filters.refundFilter
        : 'All'
    }`,
    `Payment Method: ${filters.paymentMethod || 'All'}`,
    `Channel: ${filters.orderType || 'All'}`,
    `Generated On: ${nowStr} (US Eastern Time)`,
  ].join(' | ');

  const header = [
    ['INDIAN-FLOWERS.COM — PAYMENTS & SETTLEMENTS AUDIT REPORT'],
    [filterSummary],
    [
      'All currency values in US Dollars (USD $). Sales tax is separated as a statutory liability, and customer refunds are accounted for net settlement.',
    ],
    [],
    [
      'Payment / Transaction Ref',
      'Order ID',
      'Payment Date & Time',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Payment Method',
      'Payment Status',
      'Gross Total ($)',
      'Sales Tax Collected ($)',
      'Refund Amount ($)',
      'Net Settlement ($)',
      'Refund Reason / Date',
      'Order Channel',
      'Fulfillment Status',
      'Cash Received ($)',
      'Change Returned ($)',
      'Cashier / Note',
    ],
  ];

  let sumGross = 0;
  let sumTax = 0;
  let sumRefund = 0;
  let sumNet = 0;

  const rows = orders.map((ord) => {
    const gross = round2(ord.totalAmount || 0);
    const tax = round2(ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0);
    const refund = round2(
      ord.refundAmount !== undefined && ord.refundAmount !== null
        ? ord.refundAmount
        : ord.paymentStatus === 'Refunded' || ord.status === 'Refunded'
        ? gross
        : 0
    );
    const net = round2(Math.max(0, gross - tax - refund));
    const refundInfo =
      refund > 0
        ? `${ord.refundReason || 'Refund'} (${ord.refundDate ? formatDateOnly(ord.refundDate) : 'Processed'})`
        : '-';

    sumGross += gross;
    sumTax += tax;
    sumRefund += refund;
    sumNet += net;

    return [
      ord.transactionId || ord.invoiceNumber || ord.orderId,
      ord.orderId,
      formatDateTime(ord.createdAt),
      ord.customerName || 'N/A',
      ord.customerEmail || '',
      ord.customerPhone || '',
      ord.paymentMethod || 'N/A',
      ord.paymentStatus || 'Pending',
      gross,
      tax,
      refund,
      net,
      refundInfo,
      ord.orderType === 'POS' ? 'POS Counter' : 'Online Store',
      ord.status || 'Pending',
      ord.cashReceived ? round2(ord.cashReceived) : '-',
      ord.changeReturned ? round2(ord.changeReturned) : '-',
      ord.cashierName || '',
    ];
  });

  const summaryRow = [
    `TOTALS (${orders.length} Transactions)`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    round2(sumGross),
    round2(sumTax),
    round2(sumRefund),
    round2(sumNet),
    '',
    '',
    '',
    '',
    '',
    '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, [], summaryRow]);
  ws['!cols'] = [
    { wch: 24 }, // Transaction Ref
    { wch: 16 }, // Order ID
    { wch: 22 }, // Date
    { wch: 24 }, // Customer Name
    { wch: 26 }, // Email
    { wch: 16 }, // Phone
    { wch: 18 }, // Method
    { wch: 16 }, // Status
    { wch: 14 }, // Gross
    { wch: 18 }, // Tax
    { wch: 16 }, // Refund Amount
    { wch: 18 }, // Net Settlement
    { wch: 28 }, // Refund Reason/Date
    { wch: 14 }, // Channel
    { wch: 16 }, // Fulfillment
    { wch: 16 }, // Cash Received
    { wch: 16 }, // Change Returned
    { wch: 20 }, // Cashier
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Payments Audit');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    workbook: wb,
    filename: `IndianFlowers_Payments_Report_${filenameDate}.xlsx`,
  };
}

// ============================================================================
// 3. USER DATA & CUSTOMERS EXPORT GENERATOR
// ============================================================================
export interface CustomersExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  state?: string;
}

export function generateCustomersWorkbook(customers: any[], filters: CustomersExportFilters = {}) {
  const wb = XLSX.utils.book_new();
  const nowStr = formatDateTime(new Date());

  const filterSummary = [
    `Date Range: ${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'}`,
    `Status: ${filters.status || 'All'}`,
    `State: ${filters.state || 'All 50 US States'}`,
    `Generated On: ${nowStr} (US Eastern Time)`,
  ].join(' | ');

  const header = [
    ['INDIAN-FLOWERS.COM — REGISTERED CUSTOMERS DIRECTORY & SPEND ANALYTICS'],
    [filterSummary],
    ['Customer contact and order analytics for Indian-Flowers US operations.'],
    [],
    [
      'Customer ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Street Address',
      'Apt / Suite / Unit',
      'City',
      'District / County',
      'State',
      'ZIP Code',
      'Country',
      'Account Status',
      'Joined Date',
      'Total Orders Placed',
      'Lifetime Spend ($)',
      'Average Order Value ($)',
      'Last Order Date',
      'Past Order Numbers',
    ],
  ];

  let sumOrders = 0;
  let sumSpend = 0;

  const rows = customers.map((c) => {
    const ordersCount = Number(c.totalOrders) || (c.orders ? c.orders.length : 0);
    const spend = round2(c.totalSpent || 0);
    const aov = ordersCount > 0 ? round2(spend / ordersCount) : 0;
    const orderNumbers = (c.orders || []).map((o: any) => o.orderId || o._id).join(', ');

    sumOrders += ordersCount;
    sumSpend += spend;

    return [
      c._id,
      c.name || 'N/A',
      c.email || '',
      c.phone || '',
      c.address || '',
      c.aptSuite || '',
      c.city || '',
      c.district || '',
      c.state || '',
      c.zipCode || '',
      c.country || 'US',
      c.isActive !== false ? 'Active' : 'Suspended',
      formatDateOnly(c.createdAt),
      ordersCount,
      spend,
      aov,
      c.lastOrderDate ? formatDateOnly(c.lastOrderDate) : 'No Orders Yet',
      orderNumbers,
    ];
  });

  const overallAOV = sumOrders > 0 ? round2(sumSpend / sumOrders) : 0;
  const summaryRow = [
    `TOTALS (${customers.length} Customers)`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    sumOrders,
    round2(sumSpend),
    overallAOV,
    '',
    '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, [], summaryRow]);
  ws['!cols'] = [
    { wch: 26 }, // ID
    { wch: 24 }, // Name
    { wch: 28 }, // Email
    { wch: 18 }, // Phone
    { wch: 30 }, // Address
    { wch: 16 }, // Apt
    { wch: 18 }, // City
    { wch: 16 }, // District
    { wch: 8 },  // State
    { wch: 12 }, // ZIP
    { wch: 10 }, // Country
    { wch: 14 }, // Status
    { wch: 14 }, // Joined
    { wch: 18 }, // Total Orders
    { wch: 18 }, // Spend
    { wch: 22 }, // AOV
    { wch: 16 }, // Last Order
    { wch: 35 }, // Order IDs
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Customer Directory');

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    workbook: wb,
    filename: `IndianFlowers_Customers_Directory_${filenameDate}.xlsx`,
  };
}

// ============================================================================
// 4. PROFIT & LOSS (P&L) REPORT EXCEL GENERATOR
// ============================================================================
export interface PnLExportFilters {
  startDate?: string;
  endDate?: string;
}

export function generatePnLWorkbook(pnlData: any, rawData?: { orders?: any[]; expenses?: any[]; purchases?: any[] }, filters: PnLExportFilters = {}) {
  const wb = XLSX.utils.book_new();
  const nowStr = formatDateTime(new Date());

  const periodStr = `${filters.startDate || 'Inception'} to ${filters.endDate || 'Present'}`;

  // Sheet 1: Executive P&L Statement
  const grossRev = round2(pnlData.grossSalesRevenue || 0);
  const onlineRev = round2(pnlData.onlineStoreSales || 0);
  const posRev = round2(pnlData.posCounterSales || 0);
  const b2bRev = pnlData.b2bSaleInvoices !== undefined ? round2(pnlData.b2bSaleInvoices) : round2(Math.max(0, grossRev - onlineRev - posRev));
  const returns = round2(pnlData.salesReturnTotal || 0);
  const b2bCreditNotes = round2(pnlData.b2bSalesReturns || 0);
  const orderRefunds = round2(pnlData.orderRefundsTotal || 0);
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

  const statementRows: any[] = [
    ['INDIAN-FLOWERS.COM — PROFIT & LOSS (P&L) STATEMENT'],
    [`Reporting Period: ${periodStr} | Generated On: ${nowStr} (US Eastern Time)`],
    ['All amounts in US Dollars (USD $). Sales tax collected is excluded from revenue as a fiduciary liability.'],
    [],
    ['LINE ITEM / ACCOUNT', 'BREAKDOWN', 'TOTAL ($ USD)'],
    ['1. OPERATIONAL SALES REVENUE', '', ''],
    ['   • Online Storefront Sales (Verified Paid)', '', onlineRev],
    ['   • In-Store POS Sales (Verified Paid)', '', posRev],
    ['   • B2B Wholesale / Corporate Invoices', '', b2bRev >= 0 ? b2bRev : 0],
    ['   GROSS SALES REVENUE', '', grossRev],
    ['   Less: Sales Returns & Customer Refunds', '', -returns],
  ];

  if (b2bCreditNotes > 0) {
    statementRows.push(['     - B2B Wholesale Credit Notes', '', -b2bCreditNotes]);
  }
  if (orderRefunds > 0) {
    statementRows.push(['     - Online & POS Customer Order Refunds', '', -orderRefunds]);
  }

  statementRows.push(
    ['   NET OPERATIONAL REVENUE', '', netRev],
    [],
    ['2. COST OF GOODS SOLD (COGS)', '', ''],
    ['   • Total Purchase Bills from Flower Vendors', '', purchaseBills],
    ['   Less: Purchase Returns & Vendor Credits', '', -purchaseReturns],
    ['   TOTAL COST OF GOODS SOLD (COGS)', '', cogs],
    [],
    ['3. GROSS OPERATING PROFIT', '', ''],
    ['   GROSS PROFIT (Net Sales Revenue − COGS)', '', grossProfit],
    ['   Gross Profit Margin', '', `${grossMargin}%`],
    [],
    ['4. OPERATING EXPENSES', '', '']
  );

  // Add itemized expense categories
  const expensesList: { category: string; amount: number }[] = pnlData.expenseByCategory || [];
  if (expensesList.length === 0) {
    statementRows.push(['   • No Operating Expenses Logged in Period', '', 0]);
  } else {
    expensesList.forEach((exp) => {
      statementRows.push([`   • ${exp.category}`, '', round2(exp.amount)]);
    });
  }

  statementRows.push(
    ['   TOTAL OPERATING EXPENSES', '', totalExp],
    [],
    ['5. NET FINANCIAL RESULT (PROFIT / LOSS)', '', ''],
    ['   NET PROFIT / LOSS (Gross Profit − Total Operating Expenses)', '', netProfit],
    ['   Net Profit Margin', '', `${netMargin}%`],
    ['   Operating Result Status', '', isProfit ? 'NET PROFIT' : 'NET OPERATING LOSS'],
    [],
    ['6. STATUTORY SALES TAX LIABILITIES (Fiduciary)', '', ''],
    ['   US Sales Tax Collected on behalf of Tax Authorities', '', taxCollected],
    ['   Sales Tax Payable (Separated from business operational earnings)', '', taxCollected]
  );

  const ws1 = XLSX.utils.aoa_to_sheet(statementRows);
  ws1['!cols'] = [
    { wch: 60 },
    { wch: 15 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'P&L Statement');

  // Sheet 2: Expense Register (if provided)
  if (rawData?.expenses && rawData.expenses.length > 0) {
    const expHeader = [
      ['INDIAN-FLOWERS.COM — ITEMIZED OPERATING EXPENSES LEDGER'],
      [`Period: ${periodStr} | Total Expenses: ${rawData.expenses.length}`],
      [],
      [
        'Expense Voucher #',
        'Date',
        'Category',
        'Title / Purpose',
        'Amount ($ USD)',
        'Payment Mode',
        'Paid To',
        'Reference No',
        'Notes',
      ],
    ];

    let expSum = 0;
    const expRows = rawData.expenses.map((e: any) => {
      const amt = round2(e.amount);
      expSum += amt;
      return [
        e.expenseNumber || 'EXP',
        formatDateOnly(e.date || e.createdAt),
        e.categoryName || 'General',
        e.title || 'Expense',
        amt,
        e.paymentMode || 'CASH',
        e.paidTo || '',
        e.referenceNo || '',
        e.notes || '',
      ];
    });

    const expSummaryRow = [
      `TOTAL EXPENSES (${rawData.expenses.length} Records)`,
      '',
      '',
      '',
      round2(expSum),
      '',
      '',
      '',
      '',
    ];

    const ws2 = XLSX.utils.aoa_to_sheet([...expHeader, ...expRows, [], expSummaryRow]);
    ws2['!cols'] = [
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Expense Items');
  }

  // Sheet 3: Purchase Bills (if provided)
  if (rawData?.purchases && rawData.purchases.length > 0) {
    const purHeader = [
      ['INDIAN-FLOWERS.COM — PURCHASE BILLS & VENDOR INVOICES'],
      [`Period: ${periodStr} | Total Vendor Bills: ${rawData.purchases.length}`],
      [],
      [
        'Bill / Doc #',
        'Document Type',
        'Date',
        'Vendor Name',
        'Vendor Phone',
        'Subtotal ($)',
        'Tax ($)',
        'Grand Total ($)',
        'Paid Amount ($)',
        'Balance Due ($)',
        'Payment Status',
      ],
    ];

    let purSum = 0;
    const purRows = rawData.purchases.map((p: any) => {
      const gTotal = round2(p.grandTotal);
      purSum += gTotal;
      return [
        p.docNumber || 'PB',
        p.docType || 'PURCHASE_BILL',
        formatDateOnly(p.createdAt),
        p.vendorName || 'Vendor',
        p.vendorPhone || '',
        round2(p.subtotal),
        round2(p.totalTax || p.totalGst || 0),
        gTotal,
        round2(p.paidAmount),
        round2(p.balanceAmount),
        p.paymentStatus || 'Pending',
      ];
    });

    const purSummaryRow = [
      `TOTAL PURCHASES (${rawData.purchases.length} Bills)`,
      '',
      '',
      '',
      '',
      '',
      '',
      round2(purSum),
      '',
      '',
      '',
    ];

    const ws3 = XLSX.utils.aoa_to_sheet([...purHeader, ...purRows, [], purSummaryRow]);
    ws3['!cols'] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Purchase Bills');
  }

  const filenameDate = (filters.startDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return {
    workbook: wb,
    filename: `IndianFlowers_PnL_Report_${filenameDate}.xlsx`,
  };
}

// Helper to convert workbook to binary buffer
export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
