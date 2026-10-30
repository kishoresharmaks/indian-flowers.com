import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailConfig extends Document {
  key: string;
  provider: 'msg91' | 'brevo' | 'smtp';
  // MSG91 Configuration
  msg91AuthKey: string;
  msg91FromEmail: string;
  msg91FromName: string;
  msg91Domain: string;
  msg91TemplateId: string;
  // Brevo (Sendinblue) Configuration
  brevoApiKey: string;
  brevoFromEmail: string;
  brevoFromName: string;
  // Alert Destination
  adminNotificationEmail: string;
  // SMTP Fallback Configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  // General Email Content Settings
  replySignature: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailConfigSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    provider: { type: String, enum: ['msg91', 'brevo', 'smtp'], default: 'msg91' },
    msg91AuthKey: { type: String, default: '' },
    msg91FromEmail: { type: String, default: 'orders@theindianflowers.com' },
    msg91FromName: { type: String, default: 'The Indian Flowers' },
    msg91Domain: { type: String, default: 'theindianflowers.com' },
    msg91TemplateId: { type: String, default: '' },
    // Brevo Configuration
    brevoApiKey: { type: String, default: '' },
    brevoFromEmail: { type: String, default: 'orders@theindianflowers.com' },
    brevoFromName: { type: String, default: 'The Indian Flowers' },
    adminNotificationEmail: { type: String, default: 'indianflowersorder@gmail.com' },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpSecure: { type: Boolean, default: false },
    replySignature: {
      type: String,
      default: 'Warm regards,\nThe Indian Flowers Team\n(909) 379-3678 | theindianflowers.com',
    },
  },
  { timestamps: true }
);

const EmailConfig: Model<IEmailConfig> =
  mongoose.models.EmailConfig || mongoose.model<IEmailConfig>('EmailConfig', EmailConfigSchema);

export default EmailConfig;
