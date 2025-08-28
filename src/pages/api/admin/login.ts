import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel, IAdminUser } from "@/models/Admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ENV } from "@/lib/env";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Endpoint de connexion admin.
 * - Méthode: POST
 * - Rate limit: 10 requêtes/minute par client
 * - Corps attendu: { username, password }
 * - Réponse: { token } en cas de succès
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // Anti-abus: limite à 10 req/min par IP
  const ok = await rateLimit(req, res, { windowMs: 60_000, max: 10 });
  if (!ok) return;

  const { username, password } = req.body;

  try {
    await connectToDatabase();

    const user = (await AdminModel.findOne({ username })) as IAdminUser | null;

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return res.status(401).json({ success: false });
    }

    const typedUser = user as IAdminUser & { _id: mongoose.Types.ObjectId };

    const isValid = await bcrypt.compare(password, typedUser.password);
    if (!isValid) {
      console.log("❌ Mot de passe incorrect");
      return res.status(401).json({ success: false });
    }

    // Le token inclut `id` pour rester cohérent avec l'auth des autres endpoints
    const token = jwt.sign(
      { id: typedUser._id.toString(), username: typedUser.username },
      ENV.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    console.log("✅ Connexion réussie avec JWT");
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Erreur API login:", err);
    return res.status(500).json({ success: false });
  }
}
