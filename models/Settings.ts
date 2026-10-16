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
    siteName: { type: String, default: 'Indian Flowers' },
    tagline: { type: String, default: 'Indian Flowers for Every Occasion' },
    businessName: { type: String, default: 'Indian Flowers LLC' },
    domain: { type: String, default: 'indian-flowers.com' },
    contactEmail: { type: String, default: 'support@indian-flowers.com' },
    contactPhone: { type: String, default: '+1 (510) 579-5199' },
    currency: { type: String, default: 'USD' },
    locale: { type: String, default: 'en-US' },
    timezone: { type: String, default: 'America/Los_Angeles' },
    theme: { type: String, default: 'Botanical Modern' },
    logoDataUrl: { type: String, default: '/indian-flowers-logo.svg' },
    faviconDataUrl: { type: String, default: '' },
    companyAddress: { type: String, default: '39120 Argonaut Way, Suite 428' },
    companyCity: { type: String, default: 'Fremont' },
    companyState: { type: String, default: 'CA' },
    companyZip: { type: String, default: '94538' },
    companyCountry: { type: String, default: 'United States' },
    companyTaxId: { type: String, default: '94-3829104' },
    stateTaxPermitId: { type: String, default: 'SR-KHE-102-984712' },
    bankName: { type: String, default: 'JPMorgan Chase Bank, N.A.' },
    bankAccountNo: { type: String, default: 'Checking •••• 4829' },
    bankRoutingNo: { type: String, default: '121000247' },
    bankHolder: { type: String, default: 'Indian Flowers LLC' },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
