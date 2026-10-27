import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductVariant {
  _id?: string;
  name: string;      // e.g. "2.0 feet", "2.5 feet"
  mrp: number;       // e.g. 120
  price: number;     // e.g. 100
  quantity: number;  // stock for variant
  discount?: number;
}

export interface ICategoryRef {
  id?: number;
  name: string;
  slug: string;
}

export interface IProductAttribute {
  name: string;
  terms: string[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  wpId?: number;
  description: string;
  descriptionHtml?: string;
  shortDescription?: string;
  image: string;     // Clean path or external URL (NO Base64)
  images?: string[]; // Array of clean paths or external URLs (NO Base64)
  mrp: number;
  price: number;
  discount?: number;
  quantity: number;
  isTaxable?: boolean;
  taxCode?: string;
  gst?: number;
  category?: string;
  categorySlug?: string;
  parentCategorySlug?: string;
  categories?: ICategoryRef[];
  tags?: string[];
  subcategory?: string;
  rating?: number;
  reviewsCount?: number;
  isSeoLanding?: boolean;
  hideFromHome?: boolean;
  variants?: IProductVariant[];
  attributes?: IProductAttribute[];
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
    slug: { type: String, required: true, trim: true, lowercase: true },
    wpId: { type: Number, index: true, sparse: true },
    description: { type: String, required: true },
    descriptionHtml: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    image: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    isTaxable: { type: Boolean, default: true },
    taxCode: { type: String, default: '' },
    gst: { type: Number, min: 0, default: 0 },
    category: { type: String, default: 'General' },
    categorySlug: { type: String, default: 'general', index: true },
    parentCategorySlug: { type: String, default: '', index: true },
    categories: [
      {
        id: { type: Number },
        name: { type: String },
        slug: { type: String },
      },
    ],
    tags: { type: [String], default: [] },
    subcategory: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 50 },
    isSeoLanding: { type: Boolean, default: false, index: true },
    hideFromHome: { type: Boolean, default: false, index: true },
    variants: [VariantSchema],
    attributes: [
      {
        name: { type: String },
        terms: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
);

// Optimized Indexes for MongoDB Atlas
ProductSchema.index({ slug: 1 }, { unique: true, sparse: true });
ProductSchema.index({ createdAt: -1, _id: -1 });
ProductSchema.index({ category: 1, subcategory: 1, createdAt: -1 });
ProductSchema.index({ categorySlug: 1, createdAt: -1, _id: -1 });
ProductSchema.index({ categorySlug: 1, price: 1, _id: 1 });
ProductSchema.index({ categorySlug: 1, price: -1, _id: -1 });
ProductSchema.index({ categorySlug: 1, name: 1, _id: 1 });
ProductSchema.index({ 'categories.slug': 1, createdAt: -1, _id: -1 });
ProductSchema.index({ subcategory: 1, createdAt: -1, _id: -1 });
ProductSchema.index({ isSeoLanding: 1, hideFromHome: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to ensure slug, categorySlug, SEO landing flag, and discount percentage
ProductSchema.pre('save', function (this: IProduct, next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  if (this.category && !this.categorySlug) {
    this.categorySlug = this.category
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  if (this.mrp && this.price && this.mrp > this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  // Auto-flag programmatic state/city SEO landing products
  if (this.isSeoLanding === undefined && this.name) {
    const stateUsaRegex = /(\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b.*USA)|(USA\s*$)/i;
    if (stateUsaRegex.test(this.name)) {
      this.isSeoLanding = true;
      this.hideFromHome = true;
    }
  }
  next();
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
