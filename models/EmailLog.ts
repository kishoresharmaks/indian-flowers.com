import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailLog extends Document {
  referenceId: string;
  to: string;
  recipientName: string;
  from: string;
  subject: string;
  type:
    | 'CUSTOM_ORDER_CONFIRMATION'
    | 'CUSTOM_ORDER_ADMIN_ALERT'
    | 'CONTACT_CONFIRMATION'
    | 'CONTACT_ADMIN_ALERT'
    | 'MANUAL_REPLY'
    | 'TEST_EMAIL'
    | 'ORDER_RECEIPT'
    | 'PASSWORD_RESET'
    | 'OTHER';
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  provider: 'MSG91' | 'SMTP' | 'SIMULATOR';
  errorMessage?: string;
  htmlBody?: string;
  metadata?: Record<string, any>;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema: Schema = new Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    to: { type: String, required: true, trim: true, lowercase: true, index: true },
    recipientName: { type: String, default: '' },
    from: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'CUSTOM_ORDER_CONFIRMATION',
        'CUSTOM_ORDER_ADMIN_ALERT',
        'CONTACT_CONFIRMATION',
        'CONTACT_ADMIN_ALERT',
        'MANUAL_REPLY',
        'TEST_EMAIL',
        'ORDER_RECEIPT',
        'PASSWORD_RESET',
        'OTHER',
      ],
      default: 'OTHER',
      index: true,
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SIMULATED'],
      default: 'SENT',
      index: true,
    },
    provider: {
      type: String,
      enum: ['MSG91', 'SMTP', 'SIMULATOR'],
      default: 'MSG91',
    },
    errorMessage: { type: String, default: '' },
    htmlBody: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

EmailLogSchema.index({ sentAt: -1 });

const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
