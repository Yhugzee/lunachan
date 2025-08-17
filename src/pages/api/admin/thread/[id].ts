import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { withAdminAuth } from "@/lib/withAdminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectToDatabase();

  return withAdminAuth(req, res, async () => {
    if (req.method !== "DELETE") {
      return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "ID invalide" });
    }

    try {
      const deletedThread = await Thread.findOneAndDelete({ id });
      if (!deletedThread) {
        return res.status(404).json({ message: "Thread introuvable" });
      }

      return res.status(200).json({ message: "Thread supprimé avec succès" });
    } catch (error) {
      console.error("[ADMIN DELETE ERROR]", error);
      return res.status(500).json({ message: "Erreur interne serveur" });
    }
  });
}
