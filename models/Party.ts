import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParty extends Document {
  partyType: 'CUSTOMER' | 'VENDOR' | 'BOTH';
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  openingBalance: number;
  currentBalance: number; // positive = receivables (customer owes us), negative = payables (we owe vendor)
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema: Schema = new Schema(
  {
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'VENDOR', 'BOTH'],
      default: 'CUSTOMER',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    address: { type: String, default: '' },
    gstin: { type: String, default: '', uppercase: true, trim: true },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PartySchema.index({ partyType: 1, name: 1 });
PartySchema.index({ phone: 1 });

const Party: Model<IParty> =
  mongoose.models.Party || mongoose.model<IParty>('Party', PartySchema);

export default Party;
