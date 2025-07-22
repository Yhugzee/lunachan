import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel, IAdminUser } from "@/models/Admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

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

    // Harmonisation : le token contient `id` pour être cohérent avec threads.ts
    const token = jwt.sign(
      { id: typedUser._id.toString(), username: typedUser.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    console.log("✅ Connexion réussie avec JWT");
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Erreur API login:", err);
    return res.status(500).json({ success: false });
  }
}
