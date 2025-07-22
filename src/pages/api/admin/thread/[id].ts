import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { AdminModel } from "@/models/Admin";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès refusé" });
  }

  const token = auth.replace("Bearer ", "");

  try {
    // Vérification JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const admin = await AdminModel.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin introuvable ou invalide" });
    }

    await connectToDatabase();

    // On supprime via le champ `id` (ton identifiant custom), pas `_id`
    const deletedThread = await Thread.findOneAndDelete({ id });
    if (!deletedThread) {
      return res.status(404).json({ message: "Thread introuvable" });
    }

    return res.status(200).json({ message: "Thread supprimé avec succès" });
  } catch (error) {
    console.error("[ADMIN DELETE ERROR]", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}
