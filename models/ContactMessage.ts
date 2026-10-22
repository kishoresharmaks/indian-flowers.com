import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContactMessage extends Document {
  referenceId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  eventDate?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema: Schema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    eventDate: { type: String, default: '' },
    status: { type: String, enum: ['NEW', 'IN_PROGRESS', 'RESOLVED'], default: 'NEW' },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1 });

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

export default ContactMessage;
