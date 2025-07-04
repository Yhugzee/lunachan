import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    id: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: String, required: true },
    tripcode: { type: String, required: false }, // facultatif mais bien défini
  },
  { _id: false }, // 🔹 pour éviter d’avoir un _id automatique par sous-document
);

const ThreadSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: String, required: true },
  messages: [MessageSchema],
});

export const Thread = models.Thread || model("Thread", ThreadSchema);
