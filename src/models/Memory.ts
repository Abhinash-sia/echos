import mongoose, { Document, Model, Schema } from 'mongoose';
import './Photo';

export interface IMemory {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  memoryDate: Date;
  tags: string[];
  photos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemoryDocument extends Omit<IMemory, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const MemorySchema = new Schema<IMemoryDocument>(
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
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    memoryDate: {
      type: Date,
      required: [true, 'Memory date is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => tags.map((t) => t.trim().toLowerCase()),
    },
    photos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
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

// Compound index for chronological querying per user
MemorySchema.index({ userId: 1, memoryDate: -1 });
MemorySchema.index({ userId: 1, memoryDate: 1, _id: 1 });

// Multikey compound index for tag filtering per user
MemorySchema.index({ userId: 1, tags: 1 });

/**
 * Pre-delete hooks: When a Memory is deleted (via findOneAndDelete or doc.deleteOne()),
 * unlink all referenced photos by setting memoryId to null.
 * This prevents dangling references across the Photo–Memory relationship.
 */
MemorySchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const PhotoModel = mongoose.models.Photo;
    if (PhotoModel) {
      await PhotoModel.updateMany({ memoryId: doc._id }, { $set: { memoryId: null } });
    }
  }
});

MemorySchema.pre('deleteOne', { document: true, query: false }, async function () {
  const PhotoModel = mongoose.models.Photo;
  if (PhotoModel) {
    await PhotoModel.updateMany({ memoryId: this._id }, { $set: { memoryId: null } });
  }
});

export const Memory: Model<IMemoryDocument> =
  mongoose.models.Memory || mongoose.model<IMemoryDocument>('Memory', MemorySchema);

export default Memory;
