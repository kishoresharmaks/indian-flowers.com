import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISaleDocItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  gst: number;
  lineSubtotal: number;
  lineGst: number;
  lineTotal: number;
}

export interface ISaleDocument extends Document {
  docType: 'SALE_INVOICE' | 'QUOTATION' | 'PROFORMA' | 'SALE_ORDER' | 'SALE_RETURN';
  docNumber: string;
  partyId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  billingAddress?: string;
  items: ISaleDocItem[];
  subtotal: number;
  totalGst: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountValue?: number;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  status: 'Draft' | 'Active' | 'Converted' | 'Completed' | 'Cancelled';
  convertedToDocId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleDocItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  variantName: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  gst: { type: Number, default: 0 },
  lineSubtotal: { type: Number, required: true },
  lineGst: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
});

const SaleDocumentSchema: Schema = new Schema(
  {
    docType: {
      type: String,
      enum: ['SALE_INVOICE', 'QUOTATION', 'PROFORMA', 'SALE_ORDER', 'SALE_RETURN'],
      required: true,
      index: true,
    },
    docNumber: { type: String, required: true, unique: true },
    partyId: { type: String, default: '' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', trim: true },
    billingAddress: { type: String, default: '' },
    items: [SaleDocItemSchema],
    subtotal: { type: Number, required: true },
    totalGst: { type: Number, required: true },
    discountType: { type: String, enum: ['FLAT', 'PERCENTAGE'], default: 'FLAT' },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'],
      default: 'CASH',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid'],
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Converted', 'Completed', 'Cancelled'],
      default: 'Active',
    },
    convertedToDocId: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

SaleDocumentSchema.index({ createdAt: -1 });
SaleDocumentSchema.index({ docType: 1, createdAt: -1 });

const SaleDocument: Model<ISaleDocument> =
  mongoose.models.SaleDocument || mongoose.model<ISaleDocument>('SaleDocument', SaleDocumentSchema);

export default SaleDocument;
