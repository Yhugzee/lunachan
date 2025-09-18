import mongoose from "mongoose";

export interface IMessage {
  id: string;
  content?: string;
  createdAt: string;
  tripcode?: string;
  imageUrl?: string;
  imageKey?: string;
  mimeType?: string;
  size?: number;
}

const MessageSchema = new mongoose.Schema<IMessage>(
  {
    id: { type: String, required: true },
    content: { type: String, required: false },
    createdAt: { type: String, required: true },
    tripcode: { type: String, required: false },
    imageUrl: { type: String, required: false },
    imageKey: { type: String, required: false },
    mimeType: { type: String, required: false },
    size: { type: Number, required: false },
  },
  { _id: false },
);

export interface IThread {
  _id: mongoose.Types.ObjectId;
  id: string;
  title: string;
  createdAt: string;
  boardKey: string;
  messages: IMessage[];
}

const ThreadSchema = new mongoose.Schema<IThread>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    createdAt: { type: String, required: true },
    boardKey: { type: String, required: true, lowercase: true, trim: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { versionKey: false },
);

ThreadSchema.index({ boardKey: 1, createdAt: -1 });
ThreadSchema.index({ id: 1 }, { unique: true });

export const Thread =
  mongoose.models.Thread || mongoose.model<IThread>("Thread", ThreadSchema);
