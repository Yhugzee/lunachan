import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "@/lib/withAdminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { Board } from "@/models/Board";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  return withAdminAuth(req, res, async () => {
    try {
      if (req.method === "GET") {
        const boards = await Board.find().sort({ key: 1 }).lean();
        res.status(200).json(boards);
        return;
      }

      res.status(405).json({ message: "Méthode non autorisée" });
    } catch (error) {
      console.error("[ADMIN BOARDS ERROR]", error);
      res.status(500).json({ message: "Erreur serveur", error: String(error) });
    }
  });
}
