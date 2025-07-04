import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { getTripcode } from "@/lib/tripcode";

// ➕ Génère un ID style imageboard
function generateChanId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return timestamp.slice(-7) + random;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    await connectToDatabase();

    if (req.method === "GET") {
      const thread = await Thread.findOne({ id });
      if (!thread) {
        return res.status(404).json({ message: "Thread introuvable" });
      }
      return res.status(200).json(thread);
    }

    if (req.method === "POST") {
      const { content, trip } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Contenu invalide" });
      }

      const thread = await Thread.findOne({ id });
      if (!thread) {
        return res.status(404).json({ message: "Thread non trouvé" });
      }

      console.log("[TRIP]", trip);
      console.log("[TRIPCODE]", getTripcode(trip));

      thread.messages.push({
        id: generateChanId(),
        content,
        createdAt: new Date().toISOString(),
        tripcode: getTripcode(trip),
      });

      await thread.save();
      return res.status(201).json(thread);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  } catch (error) {
    console.error("[API ERROR]", error);
    return res.status(500).json({ message: "Erreur interne serveur" });
  }
}
