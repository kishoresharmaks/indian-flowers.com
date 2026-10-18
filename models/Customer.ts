import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPointHistoryEntry {
  date: Date;
  type: 'EARNED' | 'REDEEMED' | 'REFUND_DEDUCTED' | 'REFUND_RESTORED' | 'ADJUSTED';
  points: number;
  balanceAfter: number;
  orderId?: string;
  reason: string;
  dollarEquivalent?: number;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: string; // US Street address
  aptSuite?: string;
  city: string;
  district?: string; // US District / County
  state: string; // US 2-letter State code
  zipCode: string; // US 5-digit ZIP code
  country: string; // Default: 'US'
  isActive: boolean;
  role: 'CUSTOMER';
  // Customer Loyalty / Reward Pointing System
  pointsBalance: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsHistory: IPointHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    address: { type: String, required: true, trim: true },
    aptSuite: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, default: '', trim: true },
    state: { type: String, required: true, uppercase: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'US', trim: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: 'CUSTOMER' },
    // Loyalty Pointing Fields
    pointsBalance: { type: Number, default: 0, min: 0 },
    totalPointsEarned: { type: Number, default: 0, min: 0 },
    totalPointsRedeemed: { type: Number, default: 0, min: 0 },
    pointsHistory: [
      {
        date: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ['EARNED', 'REDEEMED', 'REFUND_DEDUCTED', 'REFUND_RESTORED', 'ADJUSTED'],
          required: true,
        },
        points: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },
        orderId: { type: String, default: '' },
        reason: { type: String, default: '' },
        dollarEquivalent: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ state: 1 });
CustomerSchema.index({ zipCode: 1 });
CustomerSchema.index({ pointsBalance: -1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
