// src/pages/api/boards/[key]/threads.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Thread } from "@/models/Thread";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    await connectToDatabase();
  } catch (e) {
    console.error("[DB_CONNECT_ERROR]", e);
    return res
      .status(500)
      .json({ message: "DB connect error", error: String(e) });
  }

  const { key } = req.query;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ message: "Board invalide" });
  }

  try {
    const board = await Board.findOne({ key }).lean();
    if (!board) return res.status(404).json({ message: "Board introuvable" });

    if (req.method === "GET") {
      try {
        const threads = await Thread.find({ boardKey: key })
          .sort({ createdAt: -1 })
          .lean();
        return res.status(200).json(threads);
      } catch (e) {
        console.error("[BOARD_THREADS_GET_ERROR]", e);
        return res
          .status(500)
          .json({ message: "Erreur serveur (GET)", error: String(e) });
      }
    }

    if (req.method === "POST") {
      try {
        const { title, content, trip, imageUrl, imageKey, mimeType, size } =
          req.body || {};
        if (!title && !content && !imageUrl) {
          return res.status(400).json({ message: "Contenu ou image requis" });
        }

        const id = Date.now().toString();
        const now = new Date().toISOString();

        const created = await Thread.create({
          id,
          title: title || "(sans titre)",
          createdAt: now,
          boardKey: key,
          messages: [
            {
              id: `${id}-op`,
              content,
              createdAt: now,
              tripcode: trip || undefined,
              imageUrl,
              imageKey,
              mimeType,
              size,
            },
          ],
        });

        return res.status(201).json(created);
      } catch (e) {
        console.error("[BOARD_THREAD_CREATE_ERROR]", e);
        return res
          .status(500)
          .json({ message: "Erreur serveur (POST)", error: String(e) });
      }
    }

    return res.status(405).json({ message: "Méthode non autorisée" });
  } catch (e) {
    console.error("[BOARD_THREADS_HANDLER_ERROR]", e);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: String(e) });
  }
}
