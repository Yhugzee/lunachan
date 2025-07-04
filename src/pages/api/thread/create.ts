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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Méthode ${req.method} non autorisée`);
  }

  const { title, content, trip } = req.body;

  if (
    !title ||
    !content ||
    typeof title !== "string" ||
    typeof content !== "string"
  ) {
    return res.status(400).json({ message: "Données invalides" });
  }

  try {
    await connectToDatabase();

    const threadId = generateChanId();
    const createdAt = new Date().toISOString();

    const newThread = await Thread.create({
      id: threadId,
      title,
      createdAt,
      messages: [
        {
          id: generateChanId(),
          content,
          createdAt,
          authorId: getTripcode(trip),
        },
      ],
    });

    return res.status(201).json(newThread);
  } catch (error) {
    console.error("Erreur création thread:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
