import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITimeCapsule {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  unlockDate: Date; // Canonical field
  sealedAt: Date;
  isOpened: boolean;
  openedAt?: Date | null;
  photos: mongoose.Types.ObjectId[];
  photoUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeCapsuleDocument extends Omit<ITimeCapsule, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
  unlockAt: Date;
  isLocked(now?: Date): boolean;
}

const TimeCapsuleSchema = new Schema<ITimeCapsuleDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Capsule message is required'],
    },
    unlockDate: {
      type: Date,
      required: [true, 'Unlock date is required'],
      index: true,
    },
    sealedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isOpened: {
      type: Boolean,
      default: false,
      index: true,
    },
    openedAt: {
      type: Date,
      default: null,
    },
    photos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
    photoUrls: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual alias 'unlockAt' mapped to canonical 'unlockDate'
TimeCapsuleSchema.virtual('unlockAt')
  .get(function (this: ITimeCapsuleDocument) {
    return this.unlockDate;
  })
  .set(function (this: ITimeCapsuleDocument, value: Date) {
    this.unlockDate = value;
  });

// Method to verify actual locking status by date (isOpened is NOT a substitute for checking unlockDate)
TimeCapsuleSchema.methods.isLocked = function (
  this: ITimeCapsuleDocument,
  now: Date = new Date()
): boolean {
  return now < this.unlockDate;
};

// Compound index for querying user's locked/unlocked capsules by date
TimeCapsuleSchema.index({ userId: 1, unlockDate: 1 });
TimeCapsuleSchema.index({ userId: 1, unlockDate: 1, _id: 1 });
TimeCapsuleSchema.index({ userId: 1, isOpened: 1 });

export const TimeCapsule: Model<ITimeCapsuleDocument> =
  mongoose.models.TimeCapsule ||
  mongoose.model<ITimeCapsuleDocument>('TimeCapsule', TimeCapsuleSchema);

export default TimeCapsule;
