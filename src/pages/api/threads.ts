import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";

// 🔁 Handler de l'API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      // 🔍 Récupère uniquement les champs utiles + premier message
      const threads = await Thread.find(
        {},
        {
          id: 1,
          title: 1,
          createdAt: 1,
          messages: { $slice: 1 }, // Seulement le message d'origine (OP)
        },
      ).sort({ createdAt: -1 });

      return res.status(200).json(threads);
    } catch (error) {
      console.error("Erreur API /threads:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  }

  // ❌ Méthode non supportée
  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Méthode ${req.method} non autorisée`);
}
