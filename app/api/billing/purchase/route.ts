import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PurchaseDocument from '@/models/PurchaseDocument';
import Product from '@/models/Product';
import Party from '@/models/Party';
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

    const docs = await PurchaseDocument.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedAdmin(req)) return unauthenticatedResponse();
  const adjustedItems: { productId: string; variantName?: string; quantity: number }[] = [];
  try {
    await connectToDatabase();
    const body = await req.json();

    const { docType, vendorName, vendorPhone, items, paidAmount = 0 } = body;
    if (!docType || !vendorName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload. Items and Vendor details required.' },
        { status: 400 }
      );
    }

    // 1. Generate unique Document Number with collision safety
    const prefix = generateDocPrefix(docType);
    const docNumber = await generateNextDocNumber(PurchaseDocument, prefix);

    // 2. Perform Stock Adjustments with inventory field quantity
    if (docType === 'PURCHASE_BILL') {
      // Inward Stock: Add stock
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
        adjustedItems.push({
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity,
        });
      }
    } else if (docType === 'PURCHASE_RETURN') {
      // Return to vendor: Deduct stock
      for (const item of items) {
        if (item.variantName) {
          await Product.updateOne(
            { _id: item.productId, 'variants.name': item.variantName },
            { $inc: { 'variants.$.quantity': -item.quantity, quantity: -item.quantity } }
          );
        } else {
          await Product.updateOne(
            { _id: item.productId },
            { $inc: { quantity: -item.quantity } }
          );
        }
        adjustedItems.push({
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity,
        });
      }
    }

    // 3. Compute Totals
    const subtotal = items.reduce((s: number, i: any) => s + (i.lineSubtotal || i.purchasePrice * i.quantity), 0);
    const totalGst = items.reduce((s: number, i: any) => s + (i.lineGst || 0), 0);
    const grandTotal = items.reduce((s: number, i: any) => s + (i.lineTotal || i.purchasePrice * i.quantity), 0);
    const balanceAmount = Math.max(0, grandTotal - Number(paidAmount || 0));
    const paymentStatus = Number(paidAmount || 0) >= grandTotal ? 'Paid' : Number(paidAmount || 0) > 0 ? 'Partial' : 'Pending';

    // 4. Create Purchase Document with rollback safety
    let newDoc: any;
    try {
      newDoc = await PurchaseDocument.create({
        docType,
        docNumber,
        vendorId: body.vendorId || '',
        vendorName,
        vendorPhone,
        vendorGstin: body.vendorGstin || '',
        vendorAddress: body.vendorAddress || '',
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
      // Rollback stock changes if creation failed
      if (docType === 'PURCHASE_BILL') {
        for (const roll of adjustedItems) {
          if (roll.variantName) {
            await Product.updateOne(
              { _id: roll.productId, 'variants.name': roll.variantName },
              { $inc: { 'variants.$.quantity': -roll.quantity, quantity: -roll.quantity } }
            );
          } else {
            await Product.updateOne(
              { _id: roll.productId },
              { $inc: { quantity: -roll.quantity } }
            );
          }
        }
      } else if (docType === 'PURCHASE_RETURN') {
        for (const roll of adjustedItems) {
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

    // 5. Update Vendor Balance ONLY for PURCHASE_BILL and PURCHASE_RETURN (skip PURCHASE_ORDER)
    if (body.vendorId && (docType === 'PURCHASE_BILL' || docType === 'PURCHASE_RETURN')) {
      const balanceChange = docType === 'PURCHASE_RETURN' ? grandTotal : -balanceAmount;
      await Party.findByIdAndUpdate(body.vendorId, { $inc: { currentBalance: balanceChange } });
    }

    // 6. Record authoritative PaymentTransaction if purchase bill created with payout
    if (docType === 'PURCHASE_BILL' && Number(paidAmount || 0) > 0) {
      try {
        await PaymentTransaction.create({
          paymentType: 'PAYMENT_OUT',
          partyId: body.vendorId || '',
          partyName: vendorName,
          partyPhone: vendorPhone,
          amount: Number(paidAmount),
          paymentMode: body.paymentMethod || 'CASH',
          referenceNo: body.referenceNo || 'INITIAL_BILL_PAYMENT',
          docId: String(newDoc._id),
          docNumber: docNumber,
          notes: `Initial payout for Purchase Bill #${docNumber}`,
        });
      } catch (payErr) {
        console.error('Warning: Failed to create initial PaymentTransaction for purchase:', payErr);
      }
    }

    await captureServerEvent(req, 'purchase_document_created', {
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

    if (action === 'convert_to_bill' && docId) {
      const poDoc = await PurchaseDocument.findById(docId);
      if (!poDoc) {
        return NextResponse.json({ success: false, message: 'PO document not found.' }, { status: 404 });
      }

      // Generate unique PURCHASE_BILL number
      const prefix = generateDocPrefix('PURCHASE_BILL');
      const billNumber = await generateNextDocNumber(PurchaseDocument, prefix);

      // Add inward stock for new purchase bill using quantity field
      for (const item of poDoc.items) {
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

      const billDoc = await PurchaseDocument.create({
        docType: 'PURCHASE_BILL',
        docNumber: billNumber,
        vendorId: poDoc.vendorId,
        vendorName: poDoc.vendorName,
        vendorPhone: poDoc.vendorPhone,
        vendorGstin: poDoc.vendorGstin,
        vendorAddress: poDoc.vendorAddress,
        items: poDoc.items,
        subtotal: poDoc.subtotal,
        totalGst: poDoc.totalGst,
        grandTotal: poDoc.grandTotal,
        paidAmount: 0,
        balanceAmount: poDoc.grandTotal,
        paymentStatus: 'Pending',
        status: 'Active',
        notes: `Converted from PO #${poDoc.docNumber}`,
      });

      // Update vendor balance when PO is converted into a finalized purchase bill
      if (poDoc.vendorId) {
        await Party.findByIdAndUpdate(poDoc.vendorId, {
          $inc: { currentBalance: -billDoc.balanceAmount },
        });
      }

      // Mark PO as Converted
      poDoc.status = 'Converted';
      poDoc.convertedToDocId = String(billDoc._id);
      await poDoc.save();

      return NextResponse.json({ success: true, data: billDoc });
    }

    return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

