import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlogSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt?: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  isPublished: boolean;
  featured: boolean;
  views: number;
  publishedAt: Date;
  seo?: IBlogSeo;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '/images/banners/hero-wedding-tif-rose.jpg',
    },
    imageAlt: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'FLORAL GUIDES',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      default: 'Indian Flowers Editorial Team',
    },
    readTime: {
      type: String,
      default: '5 min read',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      noIndex: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model during Next.js Hot Module Replacement
const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);

export default Blog;
