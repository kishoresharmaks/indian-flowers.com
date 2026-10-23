import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductVariant {
  _id?: string;
  name: string;      // e.g. "250g", "500g", "1kg"
  mrp: number;       // e.g. 250
  price: number;     // e.g. 199
  quantity: number;  // stock for variant
  discount?: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  discount?: number;
  quantity: number;
  isTaxable?: boolean;
  taxCode?: string;
  gst?: number;
  category?: string;
  subcategory?: string;
  rating?: number;
  reviewsCount?: number;
  variants?: IProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema: Schema = new Schema({
  name: { type: String, required: true },
  mrp: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, default: 10 },
  discount: { type: Number, default: 0 },
});

// Pre-save hook on variant to calculate discount percentage
VariantSchema.pre('save', function (this: any, next) {
  if (this.mrp && this.price && this.mrp > this.price) {
    this.discount = Math.round(((Number(this.mrp) - Number(this.price)) / Number(this.mrp)) * 100);
  }
  next();
});

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    isTaxable: { type: Boolean, default: true },
    taxCode: { type: String, default: '' },
    gst: { type: Number, min: 0, default: 0 },
    category: { type: String, default: 'General' },
    subcategory: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 50 },
    variants: [VariantSchema],
  },
  { timestamps: true }
);

// Indexes to optimize MongoDB Atlas queries & avoid 32MB memory sort limit
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1, subcategory: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to calculate discount percentage if not manually specified
ProductSchema.pre('save', function (this: IProduct, next) {
  if (this.mrp && this.price && this.mrp > this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
