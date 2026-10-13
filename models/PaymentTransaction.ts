import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentTransaction extends Document {
  paymentType: 'PAYMENT_IN' | 'PAYMENT_OUT';
  partyId?: string;
  partyName: string;
  partyPhone: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNo?: string;
  docId?: string; // Linked SaleDocument or PurchaseDocument ID
  docNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema(
  {
    paymentType: {
      type: String,
      enum: ['PAYMENT_IN', 'PAYMENT_OUT'],
      required: true,
      index: true,
    },
    partyId: { type: String, default: '' },
    partyName: { type: String, required: true, trim: true },
    partyPhone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'],
      default: 'CASH',
    },
    referenceNo: { type: String, default: '' },
    docId: { type: String, default: '' },
    docNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PaymentTransactionSchema.index({ createdAt: -1 });

const PaymentTransaction: Model<IPaymentTransaction> =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);

export default PaymentTransaction;
