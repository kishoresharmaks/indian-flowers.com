import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import SaleDocument from '@/models/SaleDocument';
import PurchaseDocument from '@/models/PurchaseDocument';
import PaymentTransaction from '@/models/PaymentTransaction';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const partyId = searchParams.get('partyId');

    if (!phone && !partyId) {
      return NextResponse.json(
        { success: false, message: 'Phone or PartyId is required.' },
        { status: 400 }
      );
    }

    const orderQuery: any = { status: { $ne: 'Cancelled' } };
    const saleDocQuery: any = { status: { $ne: 'Cancelled' } };
    const purDocQuery: any = { status: { $ne: 'Cancelled' } };
    const paymentTxnQuery: any = {};

    if (phone) {
      orderQuery.customerPhone = phone;
      saleDocQuery.$or = [{ customerPhone: phone }];
      purDocQuery.$or = [{ vendorPhone: phone }];
      paymentTxnQuery.$or = [{ partyPhone: phone }];
      if (partyId) {
        saleDocQuery.$or.push({ partyId });
        purDocQuery.$or.push({ vendorId: partyId });
        paymentTxnQuery.$or.push({ partyId });
      }
    } else if (partyId) {
      saleDocQuery.partyId = partyId;
      purDocQuery.vendorId = partyId;
      paymentTxnQuery.partyId = partyId;
    }

    const [orders, saleDocs, purDocs, paymentTxns] = await Promise.all([
      Order.find(orderQuery).sort({ createdAt: -1 }).lean(),
      SaleDocument.find(saleDocQuery).sort({ createdAt: -1 }).lean(),
      PurchaseDocument.find(purDocQuery).sort({ createdAt: -1 }).lean(),
      PaymentTransaction.find(paymentTxnQuery).sort({ createdAt: -1 }).lean(),
    ]);

    // Format all transactions into a unified party ledger history list
    const transactions: any[] = [];

    for (const ord of orders) {
      transactions.push({
        id: ord._id,
        type: ord.orderType === 'POS' ? 'POS_SALE' : 'ONLINE_ORDER',
        docNumber: ord.invoiceNumber || ord.orderId,
        date: ord.createdAt,
        totalAmount: ord.totalAmount,
        paidAmount: ord.paymentStatus === 'Paid' ? ord.totalAmount : (ord.cashReceived || 0),
        balanceAmount: ord.paymentStatus === 'Paid' ? 0 : Math.max(0, ord.totalAmount - (ord.cashReceived || 0)),
        paymentStatus: ord.paymentStatus,
        paymentMethod: ord.paymentMethod,
        items: ord.items || [],
        rawDoc: ord,
      });
    }

    for (const doc of saleDocs) {
      transactions.push({
        id: doc._id,
        type: doc.docType,
        docNumber: doc.docNumber,
        date: (doc as any).date || doc.createdAt,
        totalAmount: doc.grandTotal,
        paidAmount: doc.paidAmount,
        balanceAmount: doc.balanceAmount,
        paymentStatus: doc.paymentStatus,
        paymentMethod: doc.paymentMethod,
        items: doc.items || [],
        rawDoc: doc,
      });
    }

    for (const doc of purDocs) {
      transactions.push({
        id: doc._id,
        type: doc.docType,
        docNumber: doc.docNumber,
        date: (doc as any).date || doc.createdAt,
        totalAmount: doc.grandTotal,
        paidAmount: doc.paidAmount,
        balanceAmount: doc.balanceAmount,
        paymentStatus: doc.paymentStatus,
        paymentMethod: doc.paymentMethod,
        items: doc.items || [],
        rawDoc: doc,
      });
    }

    for (const txn of paymentTxns) {
      transactions.push({
        id: txn._id,
        type: txn.paymentType,
        docNumber: txn.docNumber || txn.referenceNo || `${txn.paymentType === 'PAYMENT_IN' ? 'Receipt' : 'Voucher'}`,
        date: txn.createdAt,
        totalAmount: txn.amount,
        paidAmount: txn.amount,
        balanceAmount: 0,
        paymentStatus: 'Paid',
        paymentMethod: txn.paymentMode,
        items: [],
        rawDoc: txn,
      });
    }

    // Sort all transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

