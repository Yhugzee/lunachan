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
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Méthode non autorisée" });
    }

    try {
      const threads = await Thread.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json(threads);
    } catch (error) {
      console.error("[ADMIN THREADS ERROR]", error);
      return res.status(500).json({ message: "Erreur interne serveur" });
    }
  });
}
