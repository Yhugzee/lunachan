import jwt from "jsonwebtoken";
import { AdminModel } from "@/models/Admin";
import type { NextApiRequest, NextApiResponse } from "next";

type NextHandler = () => Promise<void>;

export async function withAdminAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler,
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ message: "Accès refusé" });
    return;
  }

  const token = auth.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const admin = await AdminModel.findById(decoded.id);

    if (!admin) {
      res.status(401).json({ message: "Admin introuvable ou invalide" });
      return;
    }

    req.admin = admin; // maintenant reconnu comme `IAdminUser`
    await next();
  } catch (error) {
    console.error("[AUTH ERROR]", error);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
}
