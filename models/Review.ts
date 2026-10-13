import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  customerName: string;
  location: string;
  comment: string;
  rating: number;
  avatar?: string;
  productName?: string;
  order?: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    location: { type: String, default: 'USA' },
    comment: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    avatar: { type: String, default: '' },
    productName: { type: String, default: '' },
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ featured: 1, order: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
