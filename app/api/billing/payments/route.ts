import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PaymentTransaction from '@/models/PaymentTransaction';
import SaleDocument from '@/models/SaleDocument';
import PurchaseDocument from '@/models/PurchaseDocument';
import Order from '@/models/Order';
import Party from '@/models/Party';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('paymentType');

    const filter: any = {};
    if (type) filter.paymentType = type;

    const txns = await PaymentTransaction.find(filter).sort({ createdAt: -1 }).lean();
    // Track docIds and docNumbers already backed by explicit PaymentTransactions
    const existingDocIds = new Set(
      txns.map((t: any) => String(t.docId || '')).filter(Boolean)
    );
    const existingDocNumbers = new Set(
      txns.map((t: any) => String(t.docNumber || '')).filter(Boolean)
    );

    if (!type || type === 'PAYMENT_IN') {
      // 1. Fetch POS Counter & Online Order payments (legacy orders without PaymentTransaction)
      const orderPayments = await Order.find({
        status: { $ne: 'Cancelled' },
        $or: [{ paymentStatus: 'Paid' }, { cashReceived: { $gt: 0 } }],
        _id: { $nin: Array.from(existingDocIds).filter((id) => id.length === 24) },
      })
        .sort({ createdAt: -1 })
        .lean();

      const mappedOrderPayments = orderPayments
        .filter((ord: any) => {
          const num = ord.invoiceNumber || ord.orderId;
          return !num || !existingDocNumbers.has(num);
        })
        .map((ord: any) => {
          const isPos = ord.orderType === 'POS';
          const docNumber = isPos
            ? (ord.invoiceNumber || ord.orderId || `BH-POS-${String(ord._id).slice(-6).toUpperCase()}`)
            : (ord.orderId || ord.invoiceNumber || `ORD-${String(ord._id).slice(-6).toUpperCase()}`);
          return {
            _id: `ord_${ord._id}`,
            paymentType: 'PAYMENT_IN',
            partyName: ord.customerName || (isPos ? 'Walk-in Guest' : 'Online Customer'),
            partyPhone: ord.customerPhone || '0000000000',
            amount: ord.paymentStatus === 'Paid' ? ord.totalAmount : ord.cashReceived || ord.totalAmount,
            paymentMode: ord.paymentMethod || (isPos ? 'CASH' : 'Razorpay'),
            referenceNo: ord.transactionId || ord.paymentMethod || 'DIRECT',
            docNumber,
            notes: isPos ? 'POS Counter Billing' : 'Online Customer Checkout',
            createdAt: ord.createdAt,
          };
        });

      // 2. Fetch legacy Sale Documents with paidAmount > 0 that lack explicit PaymentTransactions
      const saleDocPayments = await SaleDocument.find({
        docType: 'SALE_INVOICE',
        paidAmount: { $gt: 0 },
        _id: { $nin: Array.from(existingDocIds).filter((id) => id.length === 24) },
      })
        .sort({ createdAt: -1 })
        .lean();

      const mappedSaleDocPayments = saleDocPayments
        .filter((doc: any) => !existingDocNumbers.has(doc.docNumber))
        .map((doc: any) => ({
          _id: `saledoc_${doc._id}`,
          paymentType: 'PAYMENT_IN',
          partyName: doc.customerName,
          partyPhone: doc.customerPhone,
          amount: doc.paidAmount,
          paymentMode: doc.paymentMethod || 'CASH',
          referenceNo: 'TAX_INVOICE_PAID',
          docNumber: doc.docNumber,
          notes: `Sale Invoice Payout (#${doc.docNumber})`,
          createdAt: doc.createdAt,
        }));

      const combinedIn = [...txns, ...mappedOrderPayments, ...mappedSaleDocPayments].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ success: true, data: combinedIn });
    }

    if (type === 'PAYMENT_OUT') {
      // Fetch legacy Purchase Documents with paidAmount > 0 that lack explicit PaymentTransactions
      const purDocPayments = await PurchaseDocument.find({
        docType: 'PURCHASE_BILL',
        paidAmount: { $gt: 0 },
        _id: { $nin: Array.from(existingDocIds).filter((id) => id.length === 24) },
      })
        .sort({ createdAt: -1 })
        .lean();

      const mappedPurDocPayments = purDocPayments
        .filter((doc: any) => !existingDocNumbers.has(doc.docNumber))
        .map((doc: any) => ({
          _id: `purdoc_${doc._id}`,
          paymentType: 'PAYMENT_OUT',
          partyName: doc.vendorName,
          partyPhone: doc.vendorPhone,
          amount: doc.paidAmount,
          paymentMode: doc.paymentMethod || 'CASH',
          referenceNo: 'SUPPLIER_BILL_PAID',
          docNumber: doc.docNumber,
          notes: `Vendor Purchase Bill Payout (#${doc.docNumber})`,
          createdAt: doc.createdAt,
        }));

      const combinedOut = [...txns, ...mappedPurDocPayments].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ success: true, data: combinedOut });
    }

    return NextResponse.json({ success: true, data: txns });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const body = await req.json();

    const { paymentType, partyName, partyPhone, amount, paymentMode, docId } = body;
    if (!paymentType || !partyName || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Payment type, party name, and valid amount required.' },
        { status: 400 }
      );
    }

    const txn = await PaymentTransaction.create({
      paymentType,
      partyId: body.partyId || '',
      partyName,
      partyPhone: partyPhone || '',
      amount: Number(amount),
      paymentMode: paymentMode || 'CASH',
      referenceNo: body.referenceNo || '',
      docId: docId || '',
      docNumber: body.docNumber || '',
      notes: body.notes || '',
    });

    // Update document balance if docId supplied
    if (docId) {
      if (paymentType === 'PAYMENT_IN') {
        const saleDoc = await SaleDocument.findById(docId);
        if (saleDoc) {
          saleDoc.paidAmount += Number(amount);
          saleDoc.balanceAmount = Math.max(0, saleDoc.grandTotal - saleDoc.paidAmount);
          saleDoc.paymentStatus =
            saleDoc.paidAmount >= saleDoc.grandTotal ? 'Paid' : 'Partial';
          if (saleDoc.paidAmount >= saleDoc.grandTotal) {
            saleDoc.status = 'Completed';
          }
          await saleDoc.save();
        } else {
          // Check if docId is an Order (Storefront or POS)
          const order = await Order.findById(docId);
          if (order) {
            const currentPaid = order.paymentStatus === 'Paid' ? order.totalAmount : (order.cashReceived || 0);
            const newPaid = currentPaid + Number(amount);
            order.cashReceived = newPaid;
            if (newPaid >= order.totalAmount) {
              order.paymentStatus = 'Paid';
            }
            await order.save();
          }
        }
      } else if (paymentType === 'PAYMENT_OUT') {
        const purDoc = await PurchaseDocument.findById(docId);
        if (purDoc) {
          purDoc.paidAmount += Number(amount);
          purDoc.balanceAmount = Math.max(0, purDoc.grandTotal - purDoc.paidAmount);
          purDoc.paymentStatus =
            purDoc.paidAmount >= purDoc.grandTotal ? 'Paid' : 'Partial';
          if (purDoc.paidAmount >= purDoc.grandTotal) {
            purDoc.status = 'Completed';
          }
          await purDoc.save();
        }
      }
    }

    // Update party balance if partyId supplied
    if (body.partyId) {
      const balanceAdj = paymentType === 'PAYMENT_IN' ? -Number(amount) : Number(amount);
      await Party.findByIdAndUpdate(body.partyId, { $inc: { currentBalance: balanceAdj } });
    }

    await captureServerEvent(req, 'payment_recorded', {
      transaction_id: String(txn._id),
      payment_type: paymentType,
      amount: Number(amount),
      payment_mode: paymentMode || 'CASH',
      has_document: Boolean(docId),
    }, 'admin-billing');

    return NextResponse.json({ success: true, data: txn }, { status: 201 });
  } catch (error: any) {
    await captureServerException(req, error, 'admin-billing');
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

