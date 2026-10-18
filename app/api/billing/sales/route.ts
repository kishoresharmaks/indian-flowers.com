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
      const orders = await Order.find({ status: { $nin: ['Cancelled', 'Failed'] } })
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

      const mappedOrders = orders.map((ord: any) => {
        const isPaid = ord.paymentStatus === 'Paid';
        const isPos = ord.orderType === 'POS';
        const docNumber = isPos
          ? (ord.invoiceNumber || ord.orderId || `BH-POS-${String(ord._id).slice(-6).toUpperCase()}`)
          : (ord.orderId || ord.invoiceNumber || `ORD-${String(ord._id).slice(-6).toUpperCase()}`);
        return {
          _id: String(ord._id),
          docType: 'SALE_INVOICE',
          docNumber,
          customerName: ord.customerName || (isPos ? 'Walk-in Guest' : 'Online Customer'),
          customerPhone: ord.customerPhone || '0000000000',
          customerEmail: ord.customerEmail || '',
          billingAddress: ord.shippingAddress || '',
          notes: ord.notes || ord.refundNotes || '',
          items: ord.items || [],
          subtotal: ord.subtotal || ord.totalAmount,
          totalGst: ord.totalGst || 0,
          grandTotal: ord.totalAmount,
          paidAmount: isPaid ? ord.totalAmount : ord.cashReceived || 0,
          balanceAmount: isPaid ? 0 : Math.max(0, ord.totalAmount - (ord.cashReceived || 0)),
          paymentMethod: ord.paymentMethod || (isPos ? 'CASH' : 'Razorpay'),
          paymentStatus: ord.paymentStatus || (isPos ? 'Paid' : 'Pending'),
          status: ord.status === 'Completed' ? 'Completed' : isPaid ? 'Completed' : 'Active',
          orderSource: isPos ? 'POS' : 'ONLINE',
          revision: ord.revision || 0,
          revisions: ord.revisions || [],
          createdAt: ord.createdAt,
        };
      });

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
        docNumber: ord.orderId || ord.invoiceNumber || `ORD-${String(ord._id).slice(-6).toUpperCase()}`,
        customerName: ord.customerName || 'Online Customer',
        customerPhone: ord.customerPhone || '0000000000',
        customerEmail: ord.customerEmail || '',
        billingAddress: ord.shippingAddress || '',
        notes: ord.notes || ord.refundNotes || '',
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
        revision: ord.revision || 0,
        revisions: ord.revisions || [],
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

    if (action === 'edit_document' && docId) {
      const {
        customerName,
        customerPhone,
        customerEmail,
        billingAddress,
        partyId,
        items,
        paidAmount,
        paymentMethod,
        notes,
        revisionReason,
        revisedBy = 'Admin',
      } = body;

      if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid payload: Customer name and at least one item are required.' },
          { status: 400 }
        );
      }

      // 1. Check if target is a SaleDocument
      const saleDoc = await SaleDocument.findById(docId);
      if (saleDoc) {
        // Compute new financial totals
        const newSubtotal = items.reduce((s: number, i: any) => s + (Number(i.lineSubtotal) || Number(i.price) * Number(i.quantity)), 0);
        const newTotalGst = items.reduce((s: number, i: any) => s + (Number(i.lineGst) || 0), 0);
        const newGrandTotal = items.reduce((s: number, i: any) => s + (Number(i.lineTotal) || Number(i.price) * Number(i.quantity)), 0);
        const newPaidAmount = Number(paidAmount !== undefined ? paidAmount : saleDoc.paidAmount || 0);
        const newBalanceAmount = Math.max(0, newGrandTotal - newPaidAmount);
        const newPaymentStatus = newPaidAmount >= newGrandTotal ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Pending';

        // Stock reconciliation for SALE_INVOICE
        if (saleDoc.docType === 'SALE_INVOICE') {
          // Revert old items stock
          for (const oldItem of saleDoc.items) {
            if (oldItem.variantName) {
              await Product.updateOne(
                { _id: oldItem.productId, 'variants.name': oldItem.variantName },
                { $inc: { 'variants.$.quantity': oldItem.quantity, quantity: oldItem.quantity } }
              );
            } else {
              await Product.updateOne(
                { _id: oldItem.productId },
                { $inc: { quantity: oldItem.quantity } }
              );
            }
          }

          // Deduct new items stock with rollback safeguard
          const deductedItems: { productId: string; variantName?: string; quantity: number }[] = [];
          for (const newItem of items) {
            let res: any;
            if (newItem.variantName) {
              res = await Product.updateOne(
                {
                  _id: newItem.productId,
                  'variants.name': newItem.variantName,
                  'variants.quantity': { $gte: newItem.quantity },
                  quantity: { $gte: newItem.quantity },
                },
                {
                  $inc: {
                    'variants.$.quantity': -newItem.quantity,
                    quantity: -newItem.quantity,
                  },
                }
              );
            } else {
              res = await Product.updateOne(
                { _id: newItem.productId, quantity: { $gte: newItem.quantity } },
                { $inc: { quantity: -newItem.quantity } }
              );
            }

            if (res.modifiedCount === 0) {
              // Rollback deducted items
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

              // Re-apply original items stock
              for (const oldItem of saleDoc.items) {
                if (oldItem.variantName) {
                  await Product.updateOne(
                    { _id: oldItem.productId, 'variants.name': oldItem.variantName },
                    { $inc: { 'variants.$.quantity': -oldItem.quantity, quantity: -oldItem.quantity } }
                  );
                } else {
                  await Product.updateOne(
                    { _id: oldItem.productId },
                    { $inc: { quantity: -oldItem.quantity } }
                  );
                }
              }

              return NextResponse.json(
                {
                  success: false,
                  message: `Insufficient stock for "${newItem.name}${newItem.variantName ? ` (${newItem.variantName})` : ''}". Cannot apply revision.`,
                },
                { status: 400 }
              );
            }

            deductedItems.push({
              productId: newItem.productId,
              variantName: newItem.variantName,
              quantity: newItem.quantity,
            });
          }
        }

        // Party balance reconciliation for SALE_INVOICE or SALE_RETURN
        if (saleDoc.partyId && (saleDoc.docType === 'SALE_INVOICE' || saleDoc.docType === 'SALE_RETURN')) {
          const oldBalanceEffect = saleDoc.docType === 'SALE_RETURN' ? -saleDoc.grandTotal : saleDoc.balanceAmount;
          const newBalanceEffect = saleDoc.docType === 'SALE_RETURN' ? -newGrandTotal : newBalanceAmount;
          const balanceDelta = newBalanceEffect - oldBalanceEffect;
          if (balanceDelta !== 0) {
            await Party.findByIdAndUpdate(saleDoc.partyId, { $inc: { currentBalance: balanceDelta } });
          }
        }

        // Maintain revision history for Finalized Invoices, Quotations, and Sale Orders
        const isQuotation = saleDoc.docType === 'QUOTATION';
        const isSaleInvoice = saleDoc.docType === 'SALE_INVOICE';
        const isSaleOrder = saleDoc.docType === 'SALE_ORDER';

        if (isQuotation || isSaleInvoice || isSaleOrder) {
          const currentRevNum = (saleDoc.revision || saleDoc.revisions?.length || 0);
          const nextRevNumber = currentRevNum + 1;
          const snapshotReason = revisionReason || (
            isQuotation
              ? `Quotation revised to Rev #${nextRevNumber}`
              : isSaleOrder
              ? `Sale order updated (Rev #${nextRevNumber})`
              : `Invoice updated (Rev #${nextRevNumber})`
          );

          if (!saleDoc.revisions) {
            saleDoc.revisions = [];
          }

          saleDoc.revisions.push({
            revisionNumber: nextRevNumber,
            revisedAt: new Date(),
            revisedBy: revisedBy || 'Admin',
            reason: snapshotReason,
            previousTotal: saleDoc.grandTotal,
            newTotal: newGrandTotal,
            snapshot: {
              items: JSON.parse(JSON.stringify(saleDoc.items)),
              subtotal: saleDoc.subtotal,
              totalTax: saleDoc.totalTax || 0,
              totalGst: saleDoc.totalGst || 0,
              discountAmount: saleDoc.discountAmount || 0,
              grandTotal: saleDoc.grandTotal,
              paidAmount: saleDoc.paidAmount,
              balanceAmount: saleDoc.balanceAmount,
              customerName: saleDoc.customerName,
              customerPhone: saleDoc.customerPhone,
              customerEmail: saleDoc.customerEmail || '',
              billingAddress: saleDoc.billingAddress || '',
              notes: saleDoc.notes || '',
            },
            changeSummary: `Total changed from $${saleDoc.grandTotal?.toFixed(2)} to $${newGrandTotal?.toFixed(2)}`,
          });

          saleDoc.revision = nextRevNumber;
          saleDoc.isFinalized = true;
        }

        // Update document fields
        saleDoc.customerName = customerName;
        saleDoc.customerPhone = customerPhone;
        if (customerEmail !== undefined) saleDoc.customerEmail = customerEmail;
        if (billingAddress !== undefined) saleDoc.billingAddress = billingAddress;
        if (partyId !== undefined) saleDoc.partyId = partyId;
        saleDoc.items = items;
        saleDoc.subtotal = newSubtotal;
        saleDoc.totalGst = newTotalGst;
        saleDoc.grandTotal = newGrandTotal;
        saleDoc.paidAmount = newPaidAmount;
        saleDoc.balanceAmount = newBalanceAmount;
        saleDoc.paymentStatus = newPaymentStatus;
        if (paymentMethod) saleDoc.paymentMethod = paymentMethod;
        if (notes !== undefined) saleDoc.notes = notes;
        if (newPaymentStatus === 'Paid') {
          saleDoc.status = 'Completed';
        }

        await saleDoc.save();

        await captureServerEvent(req, 'sales_document_revised', {
          doc_id: String(saleDoc._id),
          doc_number: saleDoc.docNumber,
          doc_type: saleDoc.docType,
          revision: saleDoc.revision,
          new_total: newGrandTotal,
        }, 'admin-billing');

        return NextResponse.json({ success: true, data: saleDoc });
      }

      // 2. Check if target is an Order (online/POS order)
      const order = await Order.findById(docId);
      if (order) {
        const newSubtotal = items.reduce((s: number, i: any) => s + (Number(i.lineSubtotal) || Number(i.price) * Number(i.quantity)), 0);
        const newGrandTotal = items.reduce((s: number, i: any) => s + (Number(i.lineTotal) || Number(i.price) * Number(i.quantity)), 0);
        const currentRevNum = (order.revision || order.revisions?.length || 0);
        const nextRevNumber = currentRevNum + 1;

        if (!order.revisions) {
          order.revisions = [];
        }

        order.revisions.push({
          revisionNumber: nextRevNumber,
          revisedAt: new Date(),
          revisedBy: revisedBy || 'Admin',
          reason: revisionReason || `Order updated (Rev #${nextRevNumber})`,
          previousTotal: order.totalAmount,
          newTotal: newGrandTotal,
          snapshot: {
            items: JSON.parse(JSON.stringify(order.items)),
            subtotal: order.subtotal,
            totalTax: order.totalTax || 0,
            grandTotal: order.totalAmount,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerEmail: order.customerEmail || '',
            shippingAddress: order.shippingAddress || '',
          },
          changeSummary: `Total changed from $${order.totalAmount?.toFixed(2)} to $${newGrandTotal?.toFixed(2)}`,
        });

        order.revision = nextRevNumber;
        order.customerName = customerName;
        order.customerPhone = customerPhone;
        if (customerEmail) order.customerEmail = customerEmail;
        if (billingAddress) order.shippingAddress = billingAddress;
        order.items = items.map((it: any) => ({
          productId: it.productId,
          name: it.name,
          variantName: it.variantName || '',
          price: Number(it.price),
          quantity: Number(it.quantity),
          isTaxable: it.isTaxable !== false,
          taxCode: it.taxCode || '',
          gst: Number(it.gst || 0),
        }));
        order.subtotal = newSubtotal;
        order.totalAmount = newGrandTotal;
        await order.save();

        return NextResponse.json({ success: true, data: order });
      }

      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
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
