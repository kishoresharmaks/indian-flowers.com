import connectToDatabase from '@/lib/db';
import SaleDocument from '@/models/SaleDocument';
import PurchaseDocument from '@/models/PurchaseDocument';
import Expense from '@/models/Expense';
import Order from '@/models/Order';

export interface PnLSummary {
  startDate?: string;
  endDate?: string;
  grossSalesRevenue: number; // Pure sales subtotal excluding sales tax liability
  onlineStoreSales: number;
  posCounterSales: number;
  salesReturnTotal: number;
  netSalesRevenue: number;

  purchaseBillTotal: number; // Purchase Bills - Purchase Returns
  purchaseReturnTotal: number;
  costOfGoodsSold: number; // COGS

  grossProfit: number; // Net Sales Revenue - COGS

  totalExpenses: number;
  expenseByCategory: { category: string; amount: number }[];

  netProfit: number;
  isProfit: boolean;

  // US Sales Tax Liability (Collected on behalf of state taxing authorities)
  salesTaxCollected: number;
  salesTaxPayable: number;

  // Backward-compatible properties for legacy components
  outputGstCollected: number;
  inputGstCredit: number;
  netGstPayable: number;
}

export async function calculatePnL(startDate?: string, endDate?: string): Promise<PnLSummary> {
  await connectToDatabase();

  const queryFilter: any = {};
  if (startDate || endDate) {
    queryFilter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      queryFilter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryFilter.createdAt.$lte = end;
    }
  }

  // 1. Sales Calculation (Net of Sales Tax, as sales tax is a liability, not revenue)
  const saleDocs = await SaleDocument.find(queryFilter).lean();
  let b2bSaleInvoiceTotal = 0;
  let salesReturnTotal = 0;
  let totalSalesTax = 0;

  for (const doc of saleDocs) {
    const docTax = doc.totalTax || doc.totalGst || 0;
    const docSubtotal = doc.subtotal !== undefined ? doc.subtotal : Math.max(0, (doc.grandTotal || 0) - docTax);

    if (doc.docType === 'SALE_INVOICE') {
      b2bSaleInvoiceTotal += docSubtotal;
      totalSalesTax += docTax;
    } else if (doc.docType === 'SALE_RETURN') {
      salesReturnTotal += docSubtotal;
      totalSalesTax = Math.max(0, totalSalesTax - docTax);
    }
  }

  // Include storefront e-commerce orders & POS sales from Order collection
  const orderFilter: any = { status: { $ne: 'Cancelled' } };
  if (startDate || endDate) {
    orderFilter.createdAt = queryFilter.createdAt;
  }
  const allOrders = await Order.find(orderFilter).lean();

  let onlineStoreSales = 0;
  let posCounterSales = 0;

  for (const ord of allOrders) {
    const ordTax = ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0;
    const ordSubtotal = ord.subtotal !== undefined ? ord.subtotal : Math.max(0, (ord.totalAmount || 0) - ordTax);

    if (ord.orderType === 'POS') {
      posCounterSales += ordSubtotal;
    } else {
      onlineStoreSales += ordSubtotal;
    }
    totalSalesTax += ordTax;
  }

  const grossSalesRevenue = b2bSaleInvoiceTotal + onlineStoreSales + posCounterSales;
  const netSalesRevenue = Math.max(0, grossSalesRevenue - salesReturnTotal);

  // 2. Purchases Calculation (COGS)
  const purchaseDocs = await PurchaseDocument.find(queryFilter).lean();
  let purchaseBillTotal = 0;
  let purchaseReturnTotal = 0;

  for (const doc of purchaseDocs) {
    const docTax = doc.totalTax || doc.totalGst || 0;
    const docSubtotal = doc.subtotal !== undefined ? doc.subtotal : Math.max(0, (doc.grandTotal || 0) - docTax);

    if (doc.docType === 'PURCHASE_BILL') {
      purchaseBillTotal += docSubtotal;
    } else if (doc.docType === 'PURCHASE_RETURN') {
      purchaseReturnTotal += docSubtotal;
    }
  }

  const costOfGoodsSold = Math.max(0, purchaseBillTotal - purchaseReturnTotal);
  const grossProfit = netSalesRevenue - costOfGoodsSold;

  // 3. Operating Expenses Calculation
  const expFilter: any = {};
  if (startDate || endDate) {
    expFilter.$or = [{ date: queryFilter.createdAt }, { createdAt: queryFilter.createdAt }];
  }
  const expenses = await Expense.find(expFilter).lean();

  const categoryMap: { [cat: string]: number } = {};
  let totalExpenses = 0;

  for (const exp of expenses) {
    const cat = exp.categoryName || 'General';
    const amt = exp.amount || 0;
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    totalExpenses += amt;
  }

  const expenseByCategory = Object.keys(categoryMap).map((cat) => ({
    category: cat,
    amount: categoryMap[cat],
  }));

  // 4. Net Profit / Loss
  const netProfit = grossProfit - totalExpenses;
  const isProfit = netProfit >= 0;

  // 5. Sales Tax Liability (Separated from revenue, payable to taxing jurisdictions)
  const salesTaxLiability = Math.round(totalSalesTax * 100) / 100;

  return {
    startDate,
    endDate,
    grossSalesRevenue: Math.round(grossSalesRevenue * 100) / 100,
    onlineStoreSales: Math.round(onlineStoreSales * 100) / 100,
    posCounterSales: Math.round(posCounterSales * 100) / 100,
    salesReturnTotal: Math.round(salesReturnTotal * 100) / 100,
    netSalesRevenue: Math.round(netSalesRevenue * 100) / 100,
    purchaseBillTotal: Math.round(purchaseBillTotal * 100) / 100,
    purchaseReturnTotal: Math.round(purchaseReturnTotal * 100) / 100,
    costOfGoodsSold: Math.round(costOfGoodsSold * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    expenseByCategory,
    netProfit: Math.round(netProfit * 100) / 100,
    isProfit,
    salesTaxCollected: salesTaxLiability,
    salesTaxPayable: salesTaxLiability,
    // Backward compatibility
    outputGstCollected: salesTaxLiability,
    inputGstCredit: 0,
    netGstPayable: salesTaxLiability,
  };
}
