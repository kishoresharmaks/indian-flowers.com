import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  eyebrow?: string;
  description?: string;
  ctaText?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  badgeText?: string;
  order?: number;
  active?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    eyebrow: { type: String, default: '' },
    description: { type: String, default: '' },
    ctaText: { type: String, default: 'Shop Now' },
    image: { type: String, required: true },
    mobileImage: { type: String, default: '' },
    link: { type: String, default: '' },
    badgeText: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BannerSchema.index({ createdAt: -1 });

const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
