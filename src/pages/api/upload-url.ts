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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Méthode non autorisée" });
  const { fileName, fileType } = req.body || {};
  if (!fileName || !fileType)
    return res.status(400).json({ error: "fileName et fileType requis" });

  try {
    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: fileName,
      ContentType: fileType,
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.status(200).json({ uploadUrl });
  } catch (err: unknown) {
    console.error("[upload-url] error:", err);
    res.status(500).json({ error: "Erreur génération URL présignée" });
  }
}
