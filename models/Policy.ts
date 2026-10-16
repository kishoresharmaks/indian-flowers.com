import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPolicy extends Document {
  slug: string;
  title: string;
  subtitle?: string;
  category: 'legal' | 'shipping' | 'compliance' | 'general';
  content: string;
  effectiveDate?: string;
  lastUpdated?: string;
  metaDescription?: string;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema: Schema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['legal', 'shipping', 'compliance', 'general'],
      default: 'legal',
    },
    content: {
      type: String,
      required: true,
    },
    effectiveDate: {
      type: String,
      default: 'October 15, 2026',
    },
    lastUpdated: {
      type: String,
      default: 'October 15, 2026',
    },
    metaDescription: {
      type: String,
      default: '',
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PolicySchema.index({ order: 1, createdAt: 1 });

const Policy: Model<IPolicy> =
  mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema);

export default Policy;
