import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryMode {
  id: string;
  name: string;
  type: 'shipping' | 'pickup';
  price: number;
  description?: string;
  pickupLocation?: string;
  estimatedDays?: string;
  active: boolean;
  order: number;
}

export const DEFAULT_DELIVERY_MODES: IDeliveryMode[] = [
  {
    id: 'southwest-cargo',
    name: 'South West Airlines Priority Air Cargo',
    type: 'shipping',
    price: 55.0,
    description: 'Dewy fresh cold-chain priority air cargo to nearest Southwest Cargo airport facility.',
    estimatedDays: 'Same-Day / Next-Morning',
    active: true,
    order: 1,
  },
  {
    id: 'fedex-shipping',
    name: 'FedEx Priority Overnight',
    type: 'shipping',
    price: 48.0,
    description: 'Insulated thermal box with ice packs delivered directly to your doorstep.',
    estimatedDays: 'Next-Day Delivery',
    active: true,
    order: 2,
  },
  {
    id: 'pickup-houston',
    name: 'Local pickup (Houston)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Houston, TX',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 3,
  },
  {
    id: 'pickup-tampa',
    name: 'Local pickup (Tampa)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Tampa, FL',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 4,
  },
  {
    id: 'pickup-sacramento',
    name: 'Local pickup (Sacramento)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Sacramento, CA',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 5,
  },
  {
    id: 'pickup-reminderville',
    name: 'Local pickup (Reminderville)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Reminderville, OH',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 6,
  },
  {
    id: 'pickup-ohio',
    name: 'Local pickup (Ohio)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Ohio Hub, OH',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 7,
  },
  {
    id: 'pickup-livermore',
    name: 'Local Pickup Livermore',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Livermore, CA',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 8,
  },
  {
    id: 'pickup-inver-grove',
    name: 'Local pickup- Inver Grove Heights, MN-55077',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Inver Grove Heights, MN-55077',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 9,
  },
];

export const DEFAULT_PICKUP_HUBS: IPickupHub[] = [
  {
    id: 'hub-main-hq',
    title: 'Main Location (HQ)',
    address: '14922 Bobcat lane, Fontana, CA 92336, USA',
    hours: 'Mon – Sun: 7:00 AM – 8:00 PM PST',
    active: true,
    order: 1,
  },
  {
    id: 'hub-branch-midwest',
    title: 'Branch Location (Midwest)',
    address: '6893 Alverno ln, Inver Grove Heights, MN 55077',
    hours: 'By Appointment / Event Scheduled',
    active: true,
    order: 2,
  },
];

export interface IPickupHub {
  id: string;
  title: string;
  address: string;
  hours?: string;
  active: boolean;
  order?: number;
}

export interface ISettings extends Document {
  deliveryModes?: IDeliveryMode[];
  pickupHubs?: IPickupHub[];
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
  // FedEx Web Integration Solutions (WIS) Configuration
  fedexEnabled?: boolean;
  fedexAccountNumber?: string;
  fedexProductionMeterNumber?: string;
  fedexTestMeterNumber?: string;
  fedexAuthKey?: string;
  fedexSecretKey?: string;
  fedexEnvironment?: 'production' | 'test';
  fedexOriginZip?: string;
  fedexCompanyName?: string;
  fedexContactName?: string;
  fedexEmail?: string;
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
    // FedEx Web Integration Solutions (WIS) Configuration Defaults
    fedexEnabled: { type: Boolean, default: true },
    fedexAccountNumber: { type: String, default: '695333510' },
    fedexProductionMeterNumber: { type: String, default: '256593981' },
    fedexTestMeterNumber: { type: String, default: '256456943' },
    fedexAuthKey: { type: String, default: 'odhEUIQgzxYnhfOR' },
    fedexSecretKey: { type: String, default: '' },
    fedexEnvironment: { type: String, enum: ['production', 'test'], default: 'production' },
    fedexOriginZip: { type: String, default: '92336' },
    fedexCompanyName: { type: String, default: 'Malar Traders' },
    fedexContactName: { type: String, default: 'George Joseph' },
    fedexEmail: { type: String, default: 'indianflowers2020@gmail.com' },
    // Delivery Modes & Shipping Configuration
    deliveryModes: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          type: { type: String, enum: ['shipping', 'pickup'], default: 'shipping' },
          price: { type: Number, default: 0 },
          description: { type: String, default: '' },
          pickupLocation: { type: String, default: '' },
          estimatedDays: { type: String, default: '' },
          active: { type: Boolean, default: true },
          order: { type: Number, default: 0 },
        },
      ],
      default: () => DEFAULT_DELIVERY_MODES,
    },
    pickupHubs: {
      type: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          address: { type: String, required: true },
          hours: { type: String, default: '' },
          active: { type: Boolean, default: true },
          order: { type: Number, default: 0 },
        },
      ],
      default: () => DEFAULT_PICKUP_HUBS,
    },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
