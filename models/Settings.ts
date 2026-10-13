import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  enableUPI: boolean;
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
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    enableUPI: { type: Boolean, default: true },
    enableCOD: { type: Boolean, default: true },
    siteName: { type: String, default: 'Nexus Ecom' },
    tagline: { type: String, default: 'Commerce, configured for your business.' },
    businessName: { type: String, default: 'Nexus' },
    domain: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    locale: { type: String, default: 'en-US' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    theme: { type: String, default: 'Nexus Ecom Theme' },
    logoDataUrl: { type: String, default: '' },
    faviconDataUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
