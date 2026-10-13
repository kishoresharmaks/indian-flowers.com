import mongoose, { Document, Model, Schema } from 'mongoose';

export type InstallationState = 'DATABASE_VERIFIED' | 'LICENSE_ACTIVATED' | 'COMPLETED';

export interface IInstallation extends Document {
  key: string;
  state: InstallationState;
  databaseName: string;
  completedAt?: Date;
  environmentDownloadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InstallationSchema = new Schema<IInstallation>({
  key: { type: String, required: true, unique: true, default: 'primary' },
  state: { type: String, enum: ['DATABASE_VERIFIED', 'LICENSE_ACTIVATED', 'COMPLETED'], required: true },
  databaseName: { type: String, required: true },
  completedAt: Date,
  environmentDownloadedAt: Date,
}, { timestamps: true });

const Installation: Model<IInstallation> = mongoose.models.Installation || mongoose.model<IInstallation>('Installation', InstallationSchema);
export default Installation;
