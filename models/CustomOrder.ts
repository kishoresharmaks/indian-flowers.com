import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomOrder extends Document {
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cityState: string;
  eventDate: string;
  occasion: string;
  requirements: string;
  budget?: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONFIRMED' | 'ARCHIVED';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomOrderSchema: Schema = new Schema(
  {
    inquiryId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    cityState: { type: String, required: true, trim: true },
    eventDate: { type: String, required: true, trim: true },
    occasion: { type: String, required: true, trim: true },
    requirements: { type: String, required: true, trim: true },
    budget: { type: String, default: '' },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomOrderSchema.index({ createdAt: -1 });

const CustomOrder: Model<ICustomOrder> =
  mongoose.models.CustomOrder ||
  mongoose.model<ICustomOrder>('CustomOrder', CustomOrderSchema);

export default CustomOrder;
