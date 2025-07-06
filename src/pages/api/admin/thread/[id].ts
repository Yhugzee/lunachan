import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ message: "Accès refusé" });
  }

  try {
    await connectToDatabase();
    const result = await Thread.findOneAndDelete({ id });
    if (!result) {
      return res.status(404).json({ message: "Thread introuvable" });
    }
    res.status(200).json({ message: "Thread supprimé avec succès" });
  } catch (error) {
    console.error("[ADMIN DELETE ERROR]", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
