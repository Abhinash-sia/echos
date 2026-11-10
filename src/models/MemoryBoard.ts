import mongoose, { Document, Model, Schema } from 'mongoose';

export type BoardClusterColor = 'coral' | 'teal' | 'cobalt' | 'yellow' | 'pink';
export type BoardPinStyle = 'polaroid' | 'index-card' | 'wax-seal' | 'sticky';
export type BoardItemType = 'memory' | 'capsule';

export interface IBoardCluster {
  id: string;
  label: string;
  color: BoardClusterColor;
  summary: string;
}

export interface IBoardPin {
  itemId: string;
  itemType: BoardItemType;
  clusterId: string;
  stickyNote: string;
  rotation: number;
  pinStyle: BoardPinStyle;
}

export interface IBoardConnection {
  fromItemId: string;
  toItemId: string;
  reason: string;
}

export interface IMemoryBoard {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  boardTitle: string;
  curatorNote: string;
  focusPrompt?: string;
  generationMode: 'ai' | 'heuristic';
  modelName: string;
  clusters: IBoardCluster[];
  pins: IBoardPin[];
  connections: IBoardConnection[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMemoryBoardDocument extends Omit<IMemoryBoard, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const BoardClusterSchema = new Schema<IBoardCluster>(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    color: {
      type: String,
      enum: ['coral', 'teal', 'cobalt', 'yellow', 'pink'],
      default: 'coral',
    },
    summary: { type: String, required: true, trim: true, maxlength: 400 },
  },
  { _id: false }
);

const BoardPinSchema = new Schema<IBoardPin>(
  {
    itemId: { type: String, required: true, trim: true },
    itemType: { type: String, enum: ['memory', 'capsule'], required: true },
    clusterId: { type: String, required: true, trim: true },
    stickyNote: { type: String, required: true, trim: true, maxlength: 300 },
    rotation: { type: Number, default: 0, min: -6, max: 6 },
    pinStyle: {
      type: String,
      enum: ['polaroid', 'index-card', 'wax-seal', 'sticky'],
      default: 'index-card',
    },
  },
  { _id: false }
);

const BoardConnectionSchema = new Schema<IBoardConnection>(
  {
    fromItemId: { type: String, required: true, trim: true },
    toItemId: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const MemoryBoardSchema = new Schema<IMemoryBoardDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true,
    },
    boardTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    curatorNote: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    focusPrompt: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    generationMode: {
      type: String,
      enum: ['ai', 'heuristic'],
      default: 'heuristic',
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    clusters: {
      type: [BoardClusterSchema],
      default: [],
    },
    pins: {
      type: [BoardPinSchema],
      default: [],
    },
    connections: {
      type: [BoardConnectionSchema],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
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

MemoryBoardSchema.index({ userId: 1, updatedAt: -1 });

export const MemoryBoard: Model<IMemoryBoardDocument> =
  mongoose.models.MemoryBoard ||
  mongoose.model<IMemoryBoardDocument>('MemoryBoard', MemoryBoardSchema);

export default MemoryBoard;

