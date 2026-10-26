import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubcategory {
  _id?: string;
  name: string;
  slug?: string;
  image?: string;
  order?: number;
}

export interface ICategory extends Document {
  name: string;
  slug?: string;
  image?: string;
  order?: number;
  showOnHome?: boolean;
  subcategories?: ISubcategory[];
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    showOnHome: { type: Boolean, default: false },
    subcategories: { type: [SubcategorySchema], default: [] },
  },
  { timestamps: true }
);

CategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
CategorySchema.index({ showOnHome: 1, order: 1 });

CategorySchema.pre('save', function (this: ICategory, next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
