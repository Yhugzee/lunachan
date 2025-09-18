import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { connectToDatabase } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import crypto from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

type Body = {
  contentType?: string;
  size?: number;
  board?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });

  const { contentType, size, board } = (req.body ?? {}) as Body;

  if (!contentType || !ALLOWED.has(contentType)) {
    return res.status(400).json({ error: "Type de fichier non autorisé" });
  }
  if (!size || size > MAX_BYTES) {
    return res.status(400).json({ error: "Fichier trop volumineux" });
  }
  if (!board || !/^[a-z0-9]+$/.test(board)) {
    return res.status(400).json({ error: "Board invalide" });
  }

  // (facultatif mais propre) on vérifie que le board existe
  await connectToDatabase();
  const exists = await Board.findOne({ key: board }).lean();
  if (!exists) return res.status(404).json({ error: "Board introuvable" });

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ext = contentType.split("/")[1] || "bin";
    const key = `boards/${board}/${today}/${crypto.randomUUID()}.${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 }); // 60s
    const publicBase = process.env.R2_PUBLIC_DOMAIN!; // ex: https://pub-xxxx.r2.dev ou ton CDN
    const imageUrl = `${publicBase.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({ uploadUrl, key, imageUrl });
  } catch (err) {
    console.error("[upload/create-url] error:", err);
    return res.status(500).json({ error: "Erreur génération URL présignée" });
  }
}
