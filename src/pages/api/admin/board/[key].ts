import type { NextApiRequest, NextApiResponse } from "next";
import { withAdminAuth } from "@/lib/withAdminAuth";
import { connectToDatabase } from "@/lib/mongodb";
import { Board } from "@/models/Board";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  return withAdminAuth(req, res, async () => {
    try {
      const { key } = req.query;
      if (!key || typeof key !== "string") {
        res.status(400).json({ message: "Paramètre 'key' invalide" });
        return;
      }

      if (req.method === "PATCH") {
        const { name, description, isNSFW } = req.body || {} as {
          name?: string;
          description?: string;
          isNSFW?: unknown;
        };

        const update: Record<string, unknown> = {};
        if (typeof name === "string" && name.trim().length > 0) update.name = name.trim();
        if (typeof description === "string") update.description = description;
        if (typeof isNSFW === "boolean") update.isNSFW = isNSFW;

        if (Object.keys(update).length === 0) {
          res.status(400).json({ message: "Aucune modification fournie" });
          return;
        }

        const updated = await Board.findOneAndUpdate(
          { key },
          { $set: update },
          { new: true }
        ).lean();

        if (!updated) {
          res.status(404).json({ message: "Board introuvable" });
          return;
        }

        res.status(200).json(updated);
        return;
      }

      res.status(405).json({ message: "Méthode non autorisée" });
    } catch (error) {
      console.error("[ADMIN BOARD UPDATE ERROR]", error);
      res.status(500).json({ message: "Erreur serveur", error: String(error) });
    }
  });
}
