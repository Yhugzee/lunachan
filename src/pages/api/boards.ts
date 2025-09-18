import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Board } from "@/models/Board";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectToDatabase();

  if (req.method === "GET") {
    const boards = await Board.find().sort({ key: 1 }).lean();
    return res.status(200).json(boards);
  }

  return res.status(405).json({ message: "Méthode non autorisée" });
}
