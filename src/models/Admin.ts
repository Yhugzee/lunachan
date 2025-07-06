import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminUser extends Document {
  username: string;
  password: string;
}

const AdminUserSchema: Schema<IAdminUser> = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
