import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = { api: { bodyParser: false } };

// lis le flux en mémoire (simple et fiable)
async function streamToBuffer(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return await new Promise((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // ex: https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com
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
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    // récupère les métadonnées passées par le front
    const key = (req.headers["x-file-key"] as string) || "";
    const contentType =
      (req.headers["x-file-type"] as string) || "application/octet-stream";
    if (!key) return res.status(400).json({ error: "x-file-key manquant" });

    const body = await streamToBuffer(req);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
        // surtout pas d'ACL avec R2
      }),
    );

    const publicBase = process.env.R2_PUBLIC_DOMAIN!;
    const publicUrl = `${publicBase}/${key}`;

    return res.status(200).json({ ok: true, key, url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload-proxy] error:", err);
    return res
      .status(500)
      .json({
        error: "Upload R2 échoué",
        details: message,
      });
  }
}
