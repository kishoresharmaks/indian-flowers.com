import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  expenseNumber: string;
  categoryName: string;
  title: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  paidTo?: string;
  referenceNo?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    expenseNumber: { type: String, required: true, unique: true },
    categoryName: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'],
      default: 'CASH',
    },
    paidTo: { type: String, default: '' },
    referenceNo: { type: String, default: '' },
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
