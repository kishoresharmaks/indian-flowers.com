import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  status: 'active' | 'unsubscribed';
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
    },
    source: {
      type: String,
      default: 'storefront_newsletter',
    },
  },
  {
    timestamps: true,
  }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
