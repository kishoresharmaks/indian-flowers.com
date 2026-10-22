import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  enableRazorpay: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  enableCOD: boolean;
  siteName: string;
  tagline: string;
  businessName: string;
  domain: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  locale: string;
  timezone: string;
  theme: string;
  logoDataUrl: string;
  faviconDataUrl: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyCountry?: string;
  companyTaxId?: string;
  stateTaxPermitId?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankHolder?: string;
  // Customer Loyalty / Reward Pointing System Configuration
  loyaltyEnabled?: boolean;
  loyaltySpendAmount?: number;
  loyaltyPointsEarned?: number;
  loyaltyRedemptionEnabled?: boolean;
  loyaltyPointsPerDollar?: number;
  loyaltyMinPointsToRedeem?: number;
  loyaltyMaxRedemptionPercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    enableRazorpay: { type: Boolean, default: true },
    razorpayKeyId: { type: String, default: '' },
    razorpayKeySecret: { type: String, default: '' },
    enableCOD: { type: Boolean, default: true },
    siteName: { type: String, default: 'The Indian Flowers' },
    tagline: { type: String, default: 'Fresh and Quality Garlands Delivered Promptly Across USA' },
    businessName: { type: String, default: 'The Indian Flowers LLC' },
    domain: { type: String, default: 'indian-flowers.com' },
    contactEmail: { type: String, default: 'indianflowersorder@gmail.com' },
    contactPhone: { type: String, default: '+1 (909) 379-3678' },
    currency: { type: String, default: 'USD' },
    locale: { type: String, default: 'en-US' },
    timezone: { type: String, default: 'America/Los_Angeles' },
    theme: { type: String, default: 'Botanical Modern' },
    logoDataUrl: { type: String, default: '/the-indian-flowers-logo.webp' },
    faviconDataUrl: { type: String, default: '/the-indian-flowers-emblem.webp' },
    companyAddress: { type: String, default: '14922 Bobcat lane' },
    companyCity: { type: String, default: 'Fontana' },
    companyState: { type: String, default: 'CA' },
    companyZip: { type: String, default: '92336' },
    companyCountry: { type: String, default: 'United States' },
    companyTaxId: { type: String, default: '94-3829104' },
    stateTaxPermitId: { type: String, default: 'SR-KHE-102-984712' },
    bankName: { type: String, default: 'JPMorgan Chase Bank, N.A.' },
    bankAccountNo: { type: String, default: 'Checking •••• 4829' },
    bankRoutingNo: { type: String, default: '121000247' },
    bankHolder: { type: String, default: 'The Indian Flowers LLC' },
    // Loyalty Pointing Configuration Defaults
    loyaltyEnabled: { type: Boolean, default: true },
    loyaltySpendAmount: { type: Number, default: 100 },
    loyaltyPointsEarned: { type: Number, default: 10 },
    loyaltyRedemptionEnabled: { type: Boolean, default: true },
    loyaltyPointsPerDollar: { type: Number, default: 10 },
    loyaltyMinPointsToRedeem: { type: Number, default: 10 },
    loyaltyMaxRedemptionPercent: { type: Number, default: 100 },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
