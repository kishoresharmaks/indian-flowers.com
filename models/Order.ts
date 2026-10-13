import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  gst: number;
  image?: string;
}

export interface IOrder extends Document {
  orderId: string;
  invoiceNumber?: string;
  orderType: 'ONLINE' | 'POS';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  pincode: string;
  items: IOrderItem[];
  subtotal: number;
  totalGst: number;
  totalAmount: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountValue?: number;
  discountAmount?: number;
  paymentMethod: 'CreditCard' | 'COD' | 'ApplePay' | 'PayPal' | 'UPI' | 'CASH';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  transactionId?: string;
  cashReceived?: number;
  changeReturned?: number;
  cashierName?: string;
  cashierId?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  variantName: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  gst: { type: Number, default: 0 },
  image: { type: String },
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
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', trim: true },
    shippingAddress: { type: String, required: true },
    pincode: { type: String, required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    totalGst: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discountType: { type: String, enum: ['FLAT', 'PERCENTAGE'] },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['CreditCard', 'COD', 'ApplePay', 'PayPal', 'UPI', 'CASH'],
      default: 'CreditCard',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    transactionId: { type: String, default: '' },
    cashReceived: { type: Number },
    changeReturned: { type: Number },
    cashierName: { type: String, default: '' },
    cashierId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderType: 1, createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
