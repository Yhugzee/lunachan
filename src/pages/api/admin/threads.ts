import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ message: "Accès refusé" });
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
