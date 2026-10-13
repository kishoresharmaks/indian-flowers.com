import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const ExpenseCategory: Model<IExpenseCategory> =
  mongoose.models.ExpenseCategory ||
  mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

export default ExpenseCategory;
