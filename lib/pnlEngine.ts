import connectToDatabase from '@/lib/db';
import SaleDocument from '@/models/SaleDocument';
import PurchaseDocument from '@/models/PurchaseDocument';
import Expense from '@/models/Expense';
import Order from '@/models/Order';

export interface PnLSummary {
  startDate?: string;
  endDate?: string;
  grossSalesRevenue: number; // Sale Invoices + POS Sales - Sale Returns
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

  // 1. Sales Calculation
  const saleDocs = await SaleDocument.find(queryFilter).lean();
  let b2bSaleInvoiceTotal = 0;
  let salesReturnTotal = 0;
  let saleOutputGst = 0;

  for (const doc of saleDocs) {
    if (doc.docType === 'SALE_INVOICE') {
      b2bSaleInvoiceTotal += doc.grandTotal || 0;
      saleOutputGst += doc.totalGst || 0;
    } else if (doc.docType === 'SALE_RETURN') {
      salesReturnTotal += doc.grandTotal || 0;
    }
  }

  // Also include storefront e-commerce orders & POS sales from Order collection
  const orderFilter: any = { status: { $ne: 'Cancelled' } };
  if (startDate || endDate) {
    orderFilter.createdAt = queryFilter.createdAt;
  }
  const allOrders = await Order.find(orderFilter).lean();

  let onlineStoreSales = 0;
  let posCounterSales = 0;

  for (const ord of allOrders) {
    if (ord.orderType === 'POS') {
      posCounterSales += ord.totalAmount || 0;
    } else {
      onlineStoreSales += ord.totalAmount || 0;
    }
    saleOutputGst += ord.totalGst || 0;
  }

  const grossSalesRevenue = b2bSaleInvoiceTotal + onlineStoreSales + posCounterSales;
  const netSalesRevenue = Math.max(0, grossSalesRevenue - salesReturnTotal);

  // 2. Purchases Calculation (COGS)
  const purchaseDocs = await PurchaseDocument.find(queryFilter).lean();
  let purchaseBillTotal = 0;
  let purchaseReturnTotal = 0;
  let purchaseInputGst = 0;

  for (const doc of purchaseDocs) {
    if (doc.docType === 'PURCHASE_BILL') {
      purchaseBillTotal += doc.grandTotal || 0;
      purchaseInputGst += doc.totalGst || 0;
    } else if (doc.docType === 'PURCHASE_RETURN') {
      purchaseReturnTotal += doc.grandTotal || 0;
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

  // 5. Net GST Payable (Output GST - Input Tax Credit)
  const netGstPayable = Math.max(0, saleOutputGst - purchaseInputGst);

  return {
    startDate,
    endDate,
    grossSalesRevenue,
    onlineStoreSales,
    posCounterSales,
    salesReturnTotal,
    netSalesRevenue,
    purchaseBillTotal,
    purchaseReturnTotal,
    costOfGoodsSold,
    grossProfit,
    totalExpenses,
    expenseByCategory,
    netProfit,
    isProfit,
    outputGstCollected: saleOutputGst,
    inputGstCredit: purchaseInputGst,
    netGstPayable,
  };
}
