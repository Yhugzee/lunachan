import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from "next";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

type Body = {
  fileName?: string; // ex: "62271f2322b8c37a7581f585.jpg"
  fileType?: string; // ex: "image/jpeg"
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { fileName, fileType } = (req.body ?? {}) as Body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "fileName et fileType requis" });
  }

  // --- Clé cohérente avec l’URL publique (préfixe date) ---
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const key = `${today}/${fileName}`;

  try {
    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 min
    const publicBase = process.env.R2_PUBLIC_DOMAIN!; // ex: https://pub-xxxx.r2.dev
    const publicUrl = `${publicBase}/${key}`;

    return res.status(200).json({ uploadUrl, key, publicUrl });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[upload-url] error:", err.message);
    } else {
      console.error("[upload-url] unknown error:", err);
    }
    return res.status(500).json({ error: "Erreur génération URL présignée" });
  }
}
