import mongoose, { Schema, Document, Model } from 'mongoose';
import { TaxSnapshot } from '@/lib/tax/types';

export interface IOrderItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  isTaxable?: boolean;
  taxCode?: string;
  gst?: number; // Kept for backward compatibility with historical records
  image?: string;
}

export interface IOrder extends Document {
  orderId: string;
  invoiceNumber?: string;
  orderType: 'ONLINE' | 'POS';
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  // US Address components
  streetAddress?: string;
  aptSuite?: string;
  city?: string;
  district?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  shippingAddress: string;
  pincode?: string; // Kept for backward compatibility with historical Indian orders
  items: IOrderItem[];
  subtotal: number;
  shippingFee?: number;
  deliveryMode?: {
    id?: string;
    name?: string;
    type?: string;
    price?: number;
    description?: string;
    pickupLocation?: string;
    estimatedDays?: string;
  };
  totalTax: number;       // US Sales Tax
  totalGst?: number;      // Historical Indian GST
  taxSnapshot?: TaxSnapshot; // Durable tax calculation snapshot for invoices & audits
  totalAmount: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountValue?: number;
  discountAmount?: number;
  // Customer Loyalty / Reward Points
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  pointsAwarded?: boolean;
  paymentMethod: 'CreditCard' | 'COD' | 'ApplePay' | 'PayPal' | 'CASH' | 'Razorpay';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Partially_Refunded';
  transactionId?: string;
  cashReceived?: number;
  changeReturned?: number;
  cashierName?: string;
  cashierId?: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Completed' | 'Cancelled' | 'Refunded' | 'Returned';
  refundAmount?: number;
  refundReason?: string;
  refundDate?: Date;
  isRestocked?: boolean;
  restockedAt?: Date;
  refundNotes?: string;
  revision?: number;
  revisions?: IOrderRevision[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderRevision {
  revisionNumber: number;
  revisedAt: Date;
  revisedBy?: string;
  reason: string;
  previousTotal: number;
  newTotal: number;
  snapshot: any;
  changeSummary?: string;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  variantName: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  isTaxable: { type: Boolean, default: true },
  taxCode: { type: String, default: '' },
  gst: { type: Number, default: 0 },
  image: { type: String },
});

const OrderRevisionSchema = new Schema({
  revisionNumber: { type: Number, required: true },
  revisedAt: { type: Date, default: Date.now },
  revisedBy: { type: String, default: 'Admin' },
  reason: { type: String, default: 'Order updated' },
  previousTotal: { type: Number, required: true },
  newTotal: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  changeSummary: { type: String, default: '' },
});

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, sparse: true, index: true },
    orderType: {
      type: String,
      enum: ['ONLINE', 'POS'],
      default: 'ONLINE',
      index: true,
    },
    customerId: { type: String, sparse: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', trim: true },
    // Structured US Address fields
    streetAddress: { type: String, default: '' },
    aptSuite: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'US' },
    shippingAddress: { type: String, required: true },
    pincode: { type: String, default: '' }, // relaxed from required for historical compatibility
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    deliveryMode: {
      type: Schema.Types.Mixed,
      default: null,
    },
    totalTax: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 }, // relaxed from required for historical compatibility
    taxSnapshot: { type: Schema.Types.Mixed },
    totalAmount: { type: Number, required: true },
    discountType: { type: String, enum: ['FLAT', 'PERCENTAGE'] },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    // Loyalty Pointing
    pointsRedeemed: { type: Number, default: 0 },
    pointsDiscount: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    pointsAwarded: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ['CreditCard', 'COD', 'ApplePay', 'PayPal', 'CASH', 'Razorpay'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially_Refunded'],
      default: 'Pending',
    },
    transactionId: { type: String, default: '' },
    cashReceived: { type: Number },
    changeReturned: { type: Number },
    cashierName: { type: String, default: '' },
    cashierId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Delivered', 'Completed', 'Cancelled', 'Refunded', 'Returned'],
      default: 'Pending',
    },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    refundDate: { type: Date },
    isRestocked: { type: Boolean, default: false },
    restockedAt: { type: Date },
    refundNotes: { type: String, default: '' },
    revision: { type: Number, default: 0 },
    revisions: [OrderRevisionSchema],
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderType: 1, createdAt: -1 });
OrderSchema.index({ zipCode: 1 });
OrderSchema.index({ state: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
