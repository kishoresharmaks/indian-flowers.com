import mongoose, { Document, Model, Schema } from 'mongoose';

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
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ state: 1 });
CustomerSchema.index({ zipCode: 1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
