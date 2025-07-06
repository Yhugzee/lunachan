import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { AdminUser } from "@/models/Admin";

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

  const admin = await AdminUser.findOne();
  if (!admin || token !== admin.password) {
    return res.status(401).json({ message: "Authentification invalide" });
  }

  try {
    await connectToDatabase();
    const threads = await Thread.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(threads);
  } catch (error) {
    console.error("[ADMIN THREADS ERROR]", error);
    res.status(500).json({ message: "Erreur interne serveur" });
  }
}
