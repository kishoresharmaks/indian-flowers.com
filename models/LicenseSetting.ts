import mongoose, { Schema, Document, Model } from 'mongoose';

export type ClientLicenseStatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'INVALID' | 'UNLICENSED';

export interface ILicenseSetting extends Document {
  key: string; // 'current_license'
  licenseKey: string;
  businessName: string;
  domain: string;
  planName?: string;
  billingCycle?: string;
  features?: {
    posEnabled: boolean;
    invoicingEnabled: boolean;
  };
  status: ClientLicenseStatusType;
  validUntil: Date;
  issuedAt: Date;
  lastPingAt: Date;
  signedToken?: string;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'current_license' },
    licenseKey: { type: String, default: '', uppercase: true, trim: true },
    businessName: { type: String, default: '' },
    domain: { type: String, default: '*' },
    planName: { type: String, default: 'Pro Subscription' },
    billingCycle: { type: String, default: 'MONTHLY' },
    features: {
      posEnabled: { type: Boolean, default: true },
      invoicingEnabled: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'INVALID', 'UNLICENSED'],
      default: 'UNLICENSED',
    },
    validUntil: { type: Date },
    issuedAt: { type: Date },
    lastPingAt: { type: Date },
    signedToken: { type: String, default: '' },
    activatedAt: { type: Date },
  },
  { timestamps: true }
);

const LicenseSetting: Model<ILicenseSetting> =
  mongoose.models.LicenseSetting ||
  mongoose.model<ILicenseSetting>('LicenseSetting', LicenseSettingSchema);

export default LicenseSetting;
