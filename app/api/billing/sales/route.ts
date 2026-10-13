import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import SaleDocument from '@/models/SaleDocument';
import Product from '@/models/Product';
import Party from '@/models/Party';
import Order from '@/models/Order';
import PaymentTransaction from '@/models/PaymentTransaction';
import { generateDocPrefix, generateNextDocNumber } from '@/lib/billingUtils';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { captureServerEvent, captureServerException } from '@/lib/telemetry';

export async function GET(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const docType = searchParams.get('docType');

    const filter: any = {};
    if (docType) filter.docType = docType;

    const docs = await SaleDocument.find(filter).sort({ createdAt: -1 }).lean();

    // If querying SALE_INVOICE, automatically include POS Counter & Online Storefront orders
    if (!docType || docType === 'SALE_INVOICE') {
      const orders = await Order.find({ status: { $ne: 'Cancelled' } })
        .sort({ createdAt: -1 })
        .lean();

      const mappedDocs = docs.map((d: any) => ({
        ...d,
        status:
          d.status === 'Converted'
            ? 'Converted'
            : d.status === 'Cancelled'
            ? 'Cancelled'
            : d.paymentStatus === 'Paid'
            ? 'Completed'
            : 'Active',
      }));

      const mappedOrders = orders.map((ord: any) => ({
        _id: String(ord._id),
        docType: 'SALE_INVOICE',
        docNumber: ord.invoiceNumber || ord.orderNumber || `BH-POS-${String(ord._id).slice(-6).toUpperCase()}`,
        customerName: ord.customerName || 'Walk-in Guest',
        customerPhone: ord.customerPhone || '0000000000',
        customerEmail: ord.customerEmail || '',
        items: ord.items || [],
        subtotal: ord.subtotal || ord.totalAmount,
        totalGst: ord.totalGst || 0,
        grandTotal: ord.totalAmount,
        paidAmount: ord.paymentStatus === 'Paid' ? ord.totalAmount : ord.cashReceived || 0,
        balanceAmount: ord.paymentStatus === 'Paid' ? 0 : Math.max(0, ord.totalAmount - (ord.cashReceived || 0)),
        paymentMethod: ord.paymentMethod || 'CASH',
        paymentStatus: ord.paymentStatus || 'Paid',
        status: 'Completed',
        orderSource: ord.orderType || 'ONLINE',
        createdAt: ord.createdAt,
      }));

      const combined = [...mappedDocs, ...mappedOrders].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ success: true, data: combined });
    }

    // If querying SALE_ORDER, automatically include active/pending online customer orders
    if (docType === 'SALE_ORDER') {
      const saleOrders = await Order.find({
        orderType: { $ne: 'POS' },
        status: { $ne: 'Cancelled' },
      })
        .sort({ createdAt: -1 })
        .lean();

      const mappedSaleOrders = saleOrders.map((ord: any) => ({
        _id: String(ord._id),
        docType: 'SALE_ORDER',
        docNumber: ord.orderNumber || ord.invoiceNumber || `BH-ORD-${String(ord._id).slice(-6).toUpperCase()}`,
        customerName: ord.customerName || 'Online Customer',
        customerPhone: ord.customerPhone || '0000000000',
        customerEmail: ord.customerEmail || '',
        items: ord.items || [],
        subtotal: ord.subtotal || ord.totalAmount,
        totalGst: ord.totalGst || 0,
        grandTotal: ord.totalAmount,
        paidAmount: ord.paymentStatus === 'Paid' ? ord.totalAmount : 0,
        balanceAmount: ord.paymentStatus === 'Paid' ? 0 : ord.totalAmount,
        paymentMethod: ord.paymentMethod || 'COD',
        paymentStatus: ord.paymentStatus || 'Pending',
        status: ord.status || 'Active',
        orderSource: ord.orderType || 'ONLINE',
        createdAt: ord.createdAt,
      }));

      const combined = [...docs, ...mappedSaleOrders].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  const deductedItems: { productId: string; variantName?: string; quantity: number }[] = [];
  try {
    await connectToDatabase();
    const body = await req.json();

    const { docType, customerName, customerPhone, items, paidAmount = 0 } = body;
    if (!docType || !customerName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload. Items and Customer details required.' },
        { status: 400 }
      );
    }

    // 1. Generate unique Document Number with collision safety
    const prefix = generateDocPrefix(docType);
    const docNumber = await generateNextDocNumber(SaleDocument, prefix);

    // 2. Perform Stock Adjustments with availability validation & rollback tracking
    if (docType === 'SALE_INVOICE') {
      for (const item of items) {
        let res: any;
        if (item.variantName) {
          res = await Product.updateOne(
            {
              _id: item.productId,
              'variants.name': item.variantName,
              'variants.quantity': { $gte: item.quantity },
              quantity: { $gte: item.quantity },
            },
            {
              $inc: {
                'variants.$.quantity': -item.quantity,
                quantity: -item.quantity,
              },
            }
          );
        } else {
          res = await Product.updateOne(
            { _id: item.productId, quantity: { $gte: item.quantity } },
            { $inc: { quantity: -item.quantity } }
          );
        }

        if (res.modifiedCount === 0) {
          // Rollback any already deducted items
          for (const roll of deductedItems) {
            if (roll.variantName) {
              await Product.updateOne(
                { _id: roll.productId, 'variants.name': roll.variantName },
                { $inc: { 'variants.$.quantity': roll.quantity, quantity: roll.quantity } }
              );
            } else {
              await Product.updateOne(
                { _id: roll.productId },
                { $inc: { quantity: roll.quantity } }
              );
            }
          }

          return NextResponse.json(
            {
              success: false,
              message: `Insufficient stock for "${item.name}${
                item.variantName ? ` (${item.variantName})` : ''
              }". Available stock is less than requested quantity.`,
            },
            { status: 400 }
          );
        }

        deductedItems.push({
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity,
        });
      }
    } else if (docType === 'SALE_RETURN') {
      // Add stock back to inventory
      for (const item of items) {
        if (item.variantName) {
          await Product.updateOne(
            { _id: item.productId, 'variants.name': item.variantName },
            { $inc: { 'variants.$.quantity': item.quantity, quantity: item.quantity } }
          );
        } else {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { quantity: item.quantity } }
          );
        }
      }
    }

    // 3. Compute Totals
    const subtotal = items.reduce((s: number, i: any) => s + (i.lineSubtotal || i.price * i.quantity), 0);
    const totalGst = items.reduce((s: number, i: any) => s + (i.lineGst || 0), 0);
    const grandTotal = items.reduce((s: number, i: any) => s + (i.lineTotal || i.price * i.quantity), 0);
    const balanceAmount = Math.max(0, grandTotal - Number(paidAmount || 0));
    const paymentStatus = Number(paidAmount || 0) >= grandTotal ? 'Paid' : Number(paidAmount || 0) > 0 ? 'Partial' : 'Pending';

    // 4. Create Document with automatic rollback protection
    let newDoc: any;
    try {
      newDoc = await SaleDocument.create({
        docType,
        docNumber,
        partyId: body.partyId || '',
        customerName,
        customerPhone,
        customerEmail: body.customerEmail || '',
        billingAddress: body.billingAddress || '',
        items,
        subtotal,
        totalGst,
        grandTotal,
        paidAmount: Number(paidAmount || 0),
        balanceAmount,
        paymentMethod: body.paymentMethod || 'CASH',
        paymentStatus,
        status: 'Active',
        notes: body.notes || '',
      });
    } catch (createErr: any) {
      // Rollback deducted items
      if (docType === 'SALE_INVOICE') {
        for (const roll of deductedItems) {
          if (roll.variantName) {
            await Product.updateOne(
              { _id: roll.productId, 'variants.name': roll.variantName },
              { $inc: { 'variants.$.quantity': roll.quantity, quantity: roll.quantity } }
            );
          } else {
            await Product.updateOne(
              { _id: roll.productId },
              { $inc: { quantity: roll.quantity } }
            );
          }
        }
      }
      throw createErr;
    }

    // 5. Update Party Balance ONLY for finalized documents (SALE_INVOICE & SALE_RETURN)
    // Non-finalized estimates/orders (QUOTATION, PROFORMA, SALE_ORDER) must NOT alter party balances
    if (body.partyId && (docType === 'SALE_INVOICE' || docType === 'SALE_RETURN')) {
      const balanceChange = docType === 'SALE_RETURN' ? -grandTotal : balanceAmount;
      await Party.findByIdAndUpdate(body.partyId, { $inc: { currentBalance: balanceChange } });
    }

    // 6. Record authoritative PaymentTransaction if invoice created with paid amount
    if (docType === 'SALE_INVOICE' && Number(paidAmount || 0) > 0) {
      try {
        await PaymentTransaction.create({
          paymentType: 'PAYMENT_IN',
          partyId: body.partyId || '',
          partyName: customerName,
          partyPhone: customerPhone,
          amount: Number(paidAmount),
          paymentMode: body.paymentMethod || 'CASH',
          referenceNo: body.referenceNo || 'INITIAL_INVOICE_PAYMENT',
          docId: String(newDoc._id),
          docNumber: docNumber,
          notes: `Initial payment for Sale Invoice #${docNumber}`,
        });
      } catch (payErr) {
        console.error('Warning: Failed to create initial PaymentTransaction:', payErr);
      }
    }

    await captureServerEvent(req, 'sales_document_created', {
      document_id: String(newDoc._id),
      document_type: docType,
      item_count: items.length,
      grand_total: grandTotal,
      paid_amount: Number(paidAmount || 0),
      payment_status: paymentStatus,
    }, 'admin-billing');

    return NextResponse.json({ success: true, data: newDoc }, { status: 201 });
  } catch (error: any) {
    await captureServerException(req, error, 'admin-billing');
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, docId } = body;

    if (action === 'convert_to_invoice' && docId) {
      const sourceDoc = await SaleDocument.findById(docId);
      if (!sourceDoc) {
        return NextResponse.json({ success: false, message: 'Source document not found.' }, { status: 404 });
      }

      // Generate unique SALE_INVOICE number
      const prefix = generateDocPrefix('SALE_INVOICE');
      const invoiceNumber = await generateNextDocNumber(SaleDocument, prefix);

      // Deduct stock with availability validation
      const deductedItems: { productId: string; variantName?: string; quantity: number }[] = [];
      for (const item of sourceDoc.items) {
        let res: any;
        if (item.variantName) {
          res = await Product.updateOne(
            {
              _id: item.productId,
              'variants.name': item.variantName,
              'variants.quantity': { $gte: item.quantity },
              quantity: { $gte: item.quantity },
            },
            {
              $inc: {
                'variants.$.quantity': -item.quantity,
                quantity: -item.quantity,
              },
            }
          );
        } else {
          res = await Product.updateOne(
            { _id: item.productId, quantity: { $gte: item.quantity } },
            { $inc: { quantity: -item.quantity } }
          );
        }

        if (res.modifiedCount === 0) {
          for (const roll of deductedItems) {
            if (roll.variantName) {
              await Product.updateOne(
                { _id: roll.productId, 'variants.name': roll.variantName },
                { $inc: { 'variants.$.quantity': roll.quantity, quantity: roll.quantity } }
              );
            } else {
              await Product.updateOne(
                { _id: roll.productId },
                { $inc: { quantity: roll.quantity } }
              );
            }
          }
          return NextResponse.json(
            {
              success: false,
              message: `Cannot convert: Insufficient stock for "${item.name}${
                item.variantName ? ` (${item.variantName})` : ''
              }".`,
            },
            { status: 400 }
          );
        }

        deductedItems.push({
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity,
        });
      }

      const advancePaid = sourceDoc.paidAmount || 0;
      const remainingBalance = Math.max(0, sourceDoc.grandTotal - advancePaid);
      const convertedPaymentStatus =
        advancePaid >= sourceDoc.grandTotal ? 'Paid' : advancePaid > 0 ? 'Partial' : 'Pending';

      const invoiceDoc = await SaleDocument.create({
        docType: 'SALE_INVOICE',
        docNumber: invoiceNumber,
        partyId: sourceDoc.partyId,
        customerName: sourceDoc.customerName,
        customerPhone: sourceDoc.customerPhone,
        customerEmail: sourceDoc.customerEmail,
        billingAddress: sourceDoc.billingAddress,
        items: sourceDoc.items,
        subtotal: sourceDoc.subtotal,
        totalGst: sourceDoc.totalGst,
        grandTotal: sourceDoc.grandTotal,
        paidAmount: advancePaid,
        balanceAmount: remainingBalance,
        paymentStatus: convertedPaymentStatus,
        status: advancePaid >= sourceDoc.grandTotal ? 'Completed' : 'Active',
        notes: `Converted from ${sourceDoc.docType} #${sourceDoc.docNumber}`,
      });

      // Update party balance now that estimate is converted to an active invoice
      if (sourceDoc.partyId && remainingBalance > 0) {
        await Party.findByIdAndUpdate(sourceDoc.partyId, {
          $inc: { currentBalance: remainingBalance },
        });
      }

      // If advance payment existed on the source document, record transaction for the new invoice
      if (advancePaid > 0) {
        try {
          await PaymentTransaction.create({
            paymentType: 'PAYMENT_IN',
            partyId: sourceDoc.partyId || '',
            partyName: sourceDoc.customerName,
            partyPhone: sourceDoc.customerPhone,
            amount: advancePaid,
            paymentMode: sourceDoc.paymentMethod || 'CASH',
            referenceNo: 'CONVERTED_ADVANCE_PAYMENT',
            docId: String(invoiceDoc._id),
            docNumber: invoiceNumber,
            notes: `Advance payment carried from ${sourceDoc.docType} #${sourceDoc.docNumber}`,
          });
        } catch (payErr) {
          console.error('Warning: Failed to record advance PaymentTransaction on conversion:', payErr);
        }
      }

      // Mark source doc as Converted
      sourceDoc.status = 'Converted';
      sourceDoc.convertedToDocId = String(invoiceDoc._id);
      sourceDoc.balanceAmount = 0;
      sourceDoc.paymentStatus = 'Paid';
      await sourceDoc.save();

      return NextResponse.json({ success: true, data: invoiceDoc });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ success: false, message: 'Document ID is required.' }, { status: 400 });
    }

    const doc = await SaleDocument.findById(docId);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
    }

    // Restrict deletion to ONLY Quotations that are not in a converted or completed state
    if (doc.docType !== 'QUOTATION' || doc.status === 'Converted' || doc.status === 'Completed') {
      return NextResponse.json(
        {
          success: false,
          message: 'Deletion restricted: Only pending quotations can be deleted. Completed invoices and converted documents cannot be deleted.',
        },
        { status: 400 }
      );
    }

    await SaleDocument.findByIdAndDelete(docId);

    return NextResponse.json({ success: true, message: 'Quotation deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
