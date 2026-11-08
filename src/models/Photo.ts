import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPhoto {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  memoryId?: mongoose.Types.ObjectId | null;
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhotoDocument extends Omit<IPhoto, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const PhotoSchema = new Schema<IPhotoDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true,
    },
    memoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Memory',
      default: null,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      trim: true,
    },
    format: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    bytes: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for photo lookups per user and memory
PhotoSchema.index({ userId: 1, memoryId: 1 });

// Unique index to prevent duplicate publicIds
PhotoSchema.index({ publicId: 1 }, { unique: true });

/**
 * Pre-delete hooks: When a Photo is removed (via findOneAndDelete or doc.deleteOne()),
 * unlink its ID from any associated Memory's or TimeCapsule's photos array.
 */
PhotoSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const MemoryModel = mongoose.models.Memory;
    if (MemoryModel) {
      await MemoryModel.updateMany({ photos: doc._id }, { $pull: { photos: doc._id } });
    }
    const TimeCapsuleModel = mongoose.models.TimeCapsule;
    if (TimeCapsuleModel) {
      await TimeCapsuleModel.updateMany({ photos: doc._id }, { $pull: { photos: doc._id } });
    }
  }
});

PhotoSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const MemoryModel = mongoose.models.Memory;
  if (MemoryModel) {
    await MemoryModel.updateMany({ photos: this._id }, { $pull: { photos: this._id } });
  }
  const TimeCapsuleModel = mongoose.models.TimeCapsule;
  if (TimeCapsuleModel) {
    await TimeCapsuleModel.updateMany({ photos: this._id }, { $pull: { photos: this._id } });
  }
});

export const Photo: Model<IPhotoDocument> =
  mongoose.models.Photo || mongoose.model<IPhotoDocument>('Photo', PhotoSchema);

export default Photo;
