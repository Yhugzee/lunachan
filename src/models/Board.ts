import mongoose from "mongoose";

export interface IBoard {
  _id: mongoose.Types.ObjectId;
  key: string;
  name: string;
  description?: string;
  isNSFW?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new mongoose.Schema<IBoard>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+$/,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    isNSFW: { type: Boolean, default: false },
  },
  { timestamps: true },
);

BoardSchema.index({ key: 1 }, { unique: true });

export const Board =
  mongoose.models.Board || mongoose.model<IBoard>("Board", BoardSchema);
