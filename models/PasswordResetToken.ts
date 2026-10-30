import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPasswordResetToken extends Document {
  email: string;
  token: string;
  otp: string;
  accountType: 'customer' | 'admin';
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '2h' }, // Automatic MongoDB TTL cleanup after 2 hours
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose?.models && mongoose.models.PasswordResetToken
    ? mongoose.models.PasswordResetToken
    : mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);

export default PasswordResetToken;
