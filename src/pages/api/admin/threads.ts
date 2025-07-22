import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { AdminModel } from "@/models/Admin";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès refusé" });
  }

  const token = auth.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    // Vérifier que l’admin existe (sécurité supplémentaire)
    const admin = await AdminModel.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin introuvable ou invalide" });
    }

    await connectToDatabase();

    const threads = await Thread.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(threads);
  } catch (error) {
    console.error("[ADMIN THREADS ERROR]", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}
