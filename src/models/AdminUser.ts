import { Schema, model, models } from "mongoose";

const AdminUserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const AdminUser =
  models.AdminUser || model("AdminUser", AdminUserSchema, "admins");
