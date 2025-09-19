// src/pages/api/upload/create-url.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

// -- ENV (adapte à ton env.ts si tu centralises)
const {
  R2_ACCOUNT_ID = "",
  R2_ACCESS_KEY_ID = "",
  R2_SECRET_ACCESS_KEY = "",
  R2_BUCKET = "",
  NEXT_PUBLIC_R2_PUBLIC_HOSTNAME = "", // ex: "pub-xxxx.r2.dev" (hostname SEUL)
} = process.env;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const Body = z.object({
  board: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9_-]+$/i),
  contentType: z.string().default("application/octet-stream"),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10 MB
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid body", issues: parsed.error.flatten() });
    return;
  }

  const { board, contentType } = parsed.data;

  if (!ALLOWED.has(contentType)) {
    res.status(415).json({ message: "Unsupported media type" });
    return;
  }
  if (!R2_BUCKET || !NEXT_PUBLIC_R2_PUBLIC_HOSTNAME) {
    res.status(500).json({ message: "R2 config missing on server" });
    return;
  }

  const ext = EXT[contentType] ?? "bin";
  const key = `boards/${board}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const put = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
    // ContentLength peut être omis, R2 l’accepte sans
  });

  const uploadUrl = await getSignedUrl(s3, put, { expiresIn: 60 }); // 60s
  const imageUrl = `https://${NEXT_PUBLIC_R2_PUBLIC_HOSTNAME}/${key}`;

  res.status(200).json({ uploadUrl, key, imageUrl });
}
