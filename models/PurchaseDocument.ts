import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchaseDocItem {
  productId: string;
  name: string;
  variantName?: string;
  purchasePrice: number;
  quantity: number;
  gst: number;
  lineSubtotal: number;
  lineGst: number;
  lineTotal: number;
}

export interface IPurchaseDocument extends Document {
  docType: 'PURCHASE_BILL' | 'PURCHASE_ORDER' | 'PURCHASE_RETURN';
  docNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorPhone: string;
  vendorGstin?: string;
  vendorAddress?: string;
  items: IPurchaseDocItem[];
  subtotal: number;
  totalGst: number;
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

const PurchaseDocItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  variantName: { type: String, default: '' },
  purchasePrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  gst: { type: Number, default: 0 },
  lineSubtotal: { type: Number, required: true },
  lineGst: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
});

const PurchaseDocumentSchema: Schema = new Schema(
  {
    docType: {
      type: String,
      enum: ['PURCHASE_BILL', 'PURCHASE_ORDER', 'PURCHASE_RETURN'],
      required: true,
      index: true,
    },
    docNumber: { type: String, required: true, unique: true },
    vendorId: { type: String, default: '' },
    vendorName: { type: String, required: true, trim: true },
    vendorPhone: { type: String, required: true, trim: true },
    vendorGstin: { type: String, default: '', trim: true },
    vendorAddress: { type: String, default: '' },
    items: [PurchaseDocItemSchema],
    subtotal: { type: Number, required: true },
    totalGst: { type: Number, required: true },
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

PurchaseDocumentSchema.index({ createdAt: -1 });
PurchaseDocumentSchema.index({ docType: 1, createdAt: -1 });

const PurchaseDocument: Model<IPurchaseDocument> =
  mongoose.models.PurchaseDocument ||
  mongoose.model<IPurchaseDocument>('PurchaseDocument', PurchaseDocumentSchema);

export default PurchaseDocument;
