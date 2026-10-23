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
    slug: { type: String, trim: true },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    subcategories: { type: [SubcategorySchema], default: [] },
  },
  { timestamps: true }
);

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
