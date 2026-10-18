import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import Expense from '@/models/Expense';
import PurchaseDocument from '@/models/PurchaseDocument';
import { calculatePnL } from '@/lib/pnlEngine';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import {
  generateOrdersWorkbook,
  generatePaymentsWorkbook,
  generateCustomersWorkbook,
  generatePnLWorkbook,
  workbookToBuffer,
} from '@/lib/reports/excelExport';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) {
    return unauthenticatedResponse();
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'orders').toLowerCase();
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const isDownload = searchParams.get('download') === 'true' || format === 'excel';

    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const orderType = searchParams.get('orderType') || undefined;
    const refundFilter = searchParams.get('refundFilter') || undefined;
    const customerStatus = searchParams.get('customerStatus') || undefined;
    const state = searchParams.get('state') || undefined;

    // Build common Date Filter
    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    // ========================================================================
    // 1. ORDERS REPORT
    // ========================================================================
    if (type === 'orders') {
      const conditions: any[] = [];

      if (dateQuery.createdAt) {
        conditions.push({ createdAt: dateQuery.createdAt });
      }

      if (status && status !== 'ALL') {
        if (status === 'Refunded') {
          conditions.push({
            $or: [
              { status: 'Refunded' },
              { status: 'Returned' },
              { paymentStatus: 'Refunded' },
              { refundAmount: { $gt: 0 } },
            ],
          });
        } else if (status === 'Returned') {
          conditions.push({
            $or: [{ status: 'Returned' }, { isRestocked: true }],
          });
        } else {
          conditions.push({ status });
        }
      }

      if (paymentStatus && paymentStatus !== 'ALL') {
        if (paymentStatus === 'Refunded') {
          conditions.push({
            $or: [
              { paymentStatus: 'Refunded' },
              { status: 'Refunded' },
              { refundAmount: { $gt: 0 } },
            ],
          });
        } else if (paymentStatus === 'Partially_Refunded') {
          conditions.push({ paymentStatus: 'Partially_Refunded' });
        } else {
          conditions.push({ paymentStatus });
        }
      }

      if (refundFilter && refundFilter !== 'ALL') {
        if (refundFilter === 'REFUNDED_ONLY') {
          conditions.push({
            $or: [
              { refundAmount: { $gt: 0 } },
              { status: { $in: ['Refunded', 'Returned'] } },
              { paymentStatus: { $in: ['Refunded', 'Partially_Refunded'] } },
            ],
          });
        } else if (refundFilter === 'EXCLUDE_REFUNDS') {
          conditions.push({
            $and: [
              { $or: [{ refundAmount: { $exists: false } }, { refundAmount: 0 }, { refundAmount: null }] },
              { status: { $nin: ['Refunded', 'Returned'] } },
              { paymentStatus: { $nin: ['Refunded', 'Partially_Refunded'] } },
            ],
          });
        }
      }

      if (orderType && orderType !== 'ALL') {
        conditions.push({ orderType });
      }

      const query = conditions.length > 0 ? { $and: conditions } : {};

      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

      if (isDownload) {
        const { workbook, filename } = generateOrdersWorkbook(orders, {
          startDate,
          endDate,
          status,
          paymentStatus,
          orderType,
          refundFilter,
        });
        const buffer = workbookToBuffer(workbook);
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      // JSON Summary & Preview Data
      let totalRevenue = 0;
      let totalTax = 0;
      let totalUnits = 0;
      let totalRefunds = 0;
      let totalPointsRedeemed = 0;
      let totalPointsDiscount = 0;
      let totalPointsEarned = 0;

      orders.forEach((ord: any) => {
        const orderTotal = ord.totalAmount || 0;
        const refund =
          ord.refundAmount !== undefined && ord.refundAmount !== null
            ? Number(ord.refundAmount)
            : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
            ? orderTotal
            : 0;

        totalRevenue += orderTotal;
        totalRefunds += refund;
        totalTax += ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0;
        totalPointsRedeemed += Number(ord.pointsRedeemed) || 0;
        totalPointsDiscount += Number(ord.pointsDiscount) || 0;
        totalPointsEarned += Number(ord.pointsEarned) || 0;
        (ord.items || []).forEach((it: any) => {
          totalUnits += Number(it.quantity) || 1;
        });
      });

      const netRevenue = Math.max(0, totalRevenue - totalRefunds);

      return NextResponse.json({
        success: true,
        type: 'orders',
        count: orders.length,
        summary: {
          totalOrders: orders.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalRefunds: Math.round(totalRefunds * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalUnits,
          totalPointsRedeemed,
          totalPointsDiscount: Math.round(totalPointsDiscount * 100) / 100,
          totalPointsEarned,
        },
        data: orders,
      });
    }

    // ========================================================================
    // 2. PAYMENTS REPORT
    // ========================================================================
    if (type === 'payments') {
      const conditions: any[] = [];

      if (dateQuery.createdAt) {
        conditions.push({ createdAt: dateQuery.createdAt });
      }

      if (paymentStatus && paymentStatus !== 'ALL') {
        if (paymentStatus === 'Refunded') {
          conditions.push({
            $or: [
              { paymentStatus: 'Refunded' },
              { status: 'Refunded' },
              { refundAmount: { $gt: 0 } },
            ],
          });
        } else if (paymentStatus === 'Partially_Refunded') {
          conditions.push({ paymentStatus: 'Partially_Refunded' });
        } else {
          conditions.push({ paymentStatus });
        }
      }

      if (refundFilter && refundFilter !== 'ALL') {
        if (refundFilter === 'REFUNDED_ONLY') {
          conditions.push({
            $or: [
              { refundAmount: { $gt: 0 } },
              { status: { $in: ['Refunded', 'Returned'] } },
              { paymentStatus: { $in: ['Refunded', 'Partially_Refunded'] } },
            ],
          });
        } else if (refundFilter === 'EXCLUDE_REFUNDS') {
          conditions.push({
            $and: [
              { $or: [{ refundAmount: { $exists: false } }, { refundAmount: 0 }, { refundAmount: null }] },
              { status: { $nin: ['Refunded', 'Returned'] } },
              { paymentStatus: { $nin: ['Refunded', 'Partially_Refunded'] } },
            ],
          });
        }
      }

      if (paymentMethod && paymentMethod !== 'ALL') {
        conditions.push({ paymentMethod });
      }

      if (orderType && orderType !== 'ALL') {
        conditions.push({ orderType });
      }

      const query = conditions.length > 0 ? { $and: conditions } : {};

      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

      if (isDownload) {
        const { workbook, filename } = generatePaymentsWorkbook(orders, {
          startDate,
          endDate,
          paymentStatus,
          paymentMethod,
          orderType,
          refundFilter,
        });
        const buffer = workbookToBuffer(workbook);
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      let totalGross = 0;
      let totalTax = 0;
      let totalRefunds = 0;
      let totalNet = 0;

      orders.forEach((ord: any) => {
        const gross = ord.totalAmount || 0;
        const tax = ord.totalTax || ord.taxSnapshot?.taxAmount || ord.totalGst || 0;
        const refund =
          ord.refundAmount !== undefined && ord.refundAmount !== null
            ? Number(ord.refundAmount)
            : ord.status === 'Refunded' || ord.paymentStatus === 'Refunded'
            ? gross
            : 0;

        totalGross += gross;
        totalTax += tax;
        totalRefunds += refund;
        totalNet += Math.max(0, gross - tax - refund);
      });

      return NextResponse.json({
        success: true,
        type: 'payments',
        count: orders.length,
        summary: {
          totalPayments: orders.length,
          totalGross: Math.round(totalGross * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalRefunds: Math.round(totalRefunds * 100) / 100,
          totalNet: Math.round(totalNet * 100) / 100,
        },
        data: orders,
      });
    }

    // ========================================================================
    // 3. USER DATA & CUSTOMERS EXPORT
    // ========================================================================
    if (type === 'customers' || type === 'users') {
      const query: any = { ...dateQuery };

      if (customerStatus && customerStatus !== 'ALL') {
        query.isActive = customerStatus === 'ACTIVE';
      }
      if (state && state !== 'ALL') {
        query.state = state.toUpperCase();
      }

      const customers = await Customer.find(query).sort({ createdAt: -1 }).lean();

      // Correlate with orders
      const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();

      const enrichedCustomers = customers.map((cust: any) => {
        const custId = cust._id.toString();
        const custEmail = (cust.email || '').toLowerCase().trim();
        const custPhone = (cust.phone || '').replace(/\D/g, '');

        const custOrders = allOrders.filter((ord: any) => {
          if (ord.customerId && ord.customerId.toString() === custId) return true;
          if (custEmail && ord.customerEmail && ord.customerEmail.toLowerCase().trim() === custEmail) return true;
          if (custPhone && ord.customerPhone) {
            const ordPhone = ord.customerPhone.replace(/\D/g, '');
            if (ordPhone.length >= 10 && custPhone.length >= 10 && ordPhone.slice(-10) === custPhone.slice(-10)) {
              return true;
            }
          }
          return false;
        });

        const totalOrders = custOrders.length;
        const totalSpent = custOrders.reduce((sum: number, o: any) => {
          if (o.status === 'Cancelled' || o.status === 'Failed') return sum;
          return sum + (Number(o.totalAmount) || 0);
        }, 0);

        const lastOrderDate = custOrders.length > 0 ? custOrders[0].createdAt : null;

        return {
          ...cust,
          totalOrders,
          totalSpent: Math.round(totalSpent * 100) / 100,
          lastOrderDate,
          orders: custOrders,
        };
      });

      if (isDownload) {
        const { workbook, filename } = generateCustomersWorkbook(enrichedCustomers, {
          startDate,
          endDate,
          status: customerStatus,
          state,
        });
        const buffer = workbookToBuffer(workbook);
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      let totalCustOrders = 0;
      let totalCustSpend = 0;
      enrichedCustomers.forEach((c) => {
        totalCustOrders += c.totalOrders;
        totalCustSpend += c.totalSpent;
      });

      return NextResponse.json({
        success: true,
        type: 'customers',
        count: enrichedCustomers.length,
        summary: {
          totalCustomers: enrichedCustomers.length,
          activeCustomers: enrichedCustomers.filter((c) => c.isActive).length,
          totalOrders: totalCustOrders,
          totalSpent: Math.round(totalCustSpend * 100) / 100,
        },
        data: enrichedCustomers,
      });
    }

    // ========================================================================
    // 4. PROFIT & LOSS (P&L) REPORT
    // ========================================================================
    if (type === 'pnl') {
      const pnlSummary = await calculatePnL(startDate, endDate);

      // Fetch underlying expenses and purchases for granular sheets
      const expFilter: any = {};
      if (startDate || endDate) {
        expFilter.$or = [{ date: dateQuery.createdAt }, { createdAt: dateQuery.createdAt }];
      }
      const [expenses, purchases] = await Promise.all([
        Expense.find(expFilter).sort({ date: -1 }).lean(),
        PurchaseDocument.find(dateQuery).sort({ createdAt: -1 }).lean(),
      ]);

      if (isDownload) {
        const { workbook, filename } = generatePnLWorkbook(
          pnlSummary,
          { expenses, purchases },
          { startDate, endDate }
        );
        const buffer = workbookToBuffer(workbook);
        return new NextResponse(buffer as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      }

      return NextResponse.json({
        success: true,
        type: 'pnl',
        summary: pnlSummary,
        expensesCount: expenses.length,
        purchasesCount: purchases.length,
        expenses,
        purchases,
      });
    }

    return NextResponse.json({ success: false, message: `Unknown report type: ${type}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Report generation failed' }, { status: 500 });
  }
}
