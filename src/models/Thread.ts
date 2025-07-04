import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  id: String,
  content: String,
  createdAt: String,
  authorId: String,
});

const ThreadSchema = new Schema({
  id: String,
  title: String,
  createdAt: String,
  messages: [MessageSchema],
});

export const Thread = models.Thread || model("Thread", ThreadSchema);
