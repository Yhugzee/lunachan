import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectToDatabase();

  // 🟢 GET — liste tous les threads
  if (req.method === "GET") {
    try {
      const threads = await Thread.find({}, { messages: 0 }).sort({
        createdAt: -1,
      });
      res.status(200).json(threads);
    } catch (error) {
      console.error("Erreur lecture threads:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  // 🟣 POST — créer un nouveau thread
  else if (req.method === "POST") {
    const { title, content, trip } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Titre ou contenu manquant" });

    const { getTripcode } = await import("@/lib/tripcode");
    const generateChanId = () =>
      Date.now().toString().slice(-7) +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");

    try {
      const newThread = await Thread.create({
        id: generateChanId(),
        title,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: generateChanId(),
            content,
            createdAt: new Date().toISOString(),
            authorId: getTripcode(trip),
          },
        ],
      });

      res.status(201).json(newThread);
    } catch (error) {
      console.error("Erreur création thread:", error);
      res.status(500).json({ message: "Erreur création thread" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
