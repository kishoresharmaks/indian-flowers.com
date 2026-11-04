import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomOrder extends Document {
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  // Product-specific custom order fields
  productId?: string;
  productCode?: string;
  productTitle?: string;
  variantName?: string;
  quantity?: number;
  address?: string;
  size?: string;
  preferredColor?: string;
  deliveryDate?: string;
  // Event & general inquiry fields (backward compatible)
  cityState?: string;
  eventDate?: string;
  occasion?: string;
  requirements?: string;
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
    // Product-specific fields
    productId: { type: String, default: '', trim: true },
    productCode: { type: String, default: '', trim: true, index: true },
    productTitle: { type: String, default: '', trim: true },
    variantName: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    address: { type: String, default: '', trim: true },
    size: { type: String, default: '', trim: true },
    preferredColor: { type: String, default: '', trim: true },
    deliveryDate: { type: String, default: '', trim: true },
    // Event & general inquiry fields
    cityState: { type: String, default: '', trim: true },
    eventDate: { type: String, default: '', trim: true },
    occasion: { type: String, default: '', trim: true },
    requirements: { type: String, default: '', trim: true },
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
