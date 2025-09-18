import mongoose from "mongoose";

export interface IAdminUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string; // hashé
  createdAt: Date;
}

const AdminSchema = new mongoose.Schema<IAdminUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const AdminModel =
  mongoose.models.Admin || mongoose.model<IAdminUser>("Admin", AdminSchema);
