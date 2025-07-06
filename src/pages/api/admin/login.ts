import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminUser } from "@/models/Admin";
import bcrypt from "bcrypt";

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
    const user = await AdminUser.findOne({ username });

    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return res.status(401).json({ success: false });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("❌ Mot de passe incorrect");
      return res.status(401).json({ success: false });
    }

    console.log("✅ Connexion réussie");
    res.status(200).json({ token: user.password });
  } catch (err) {
    console.error("Erreur API login:", err);
    res.status(500).json({ success: false });
  }
}
