import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import type { IThread, IMessage } from "@/models/Thread"; // si tu as exporté les interfaces

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectToDatabase();
  } catch (e) {
    console.error("[THREAD_API_DB_ERROR]", e);
    return res.status(500).json({ message: "DB connection error" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "ID invalide" });
  }

  if (req.method === "GET") {
    try {
      const th = await Thread.findOne({ id }).lean<IThread | null>();
      if (!th) return res.status(404).json({ message: "Thread introuvable" });
      return res.status(200).json(th);
    } catch (e) {
      console.error("[THREAD_GET_ERROR]", e);
      return res.status(500).json({ message: "Erreur serveur (GET)" });
    }
  }

  if (req.method === "POST") {
    try {
      const { content, tripcode, imageUrl, imageKey, mimeType, size } =
        (req.body ?? {}) as Partial<IMessage>;

      if (!content && !imageUrl) {
        return res.status(400).json({ message: "Contenu ou image requis" });
      }

      const now = new Date().toISOString();
      const msg: IMessage = {
        id: `${Date.now()}-r`,
        content,
        createdAt: now,
        tripcode,
        imageUrl,
        imageKey,
        mimeType,
        size,
      };

      const result = await Thread.updateOne(
        { id },
        { $push: { messages: msg } },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Thread introuvable" });
      }

      return res.status(201).json({ ok: true, message: msg });
    } catch (e) {
      console.error("[THREAD_POST_REPLY_ERROR]", e);
      return res.status(500).json({ message: "Erreur serveur (POST reply)" });
    }
  }

  return res.status(405).json({ message: "Méthode non autorisée" });
}
