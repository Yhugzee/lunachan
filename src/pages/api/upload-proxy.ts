import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const config = { api: { bodyParser: false } };

// Lit le flux HTTP entier en mémoire
async function streamToBuffer(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function safeHeader(req: NextApiRequest, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" ? v : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // On accepte soit des headers, soit des query params
  const headerFileName = safeHeader(req, "x-file-name");
  const headerFileType = safeHeader(req, "x-file-type");
  const qFileName =
    typeof req.query.fileName === "string" ? req.query.fileName : undefined;
  const qFileType =
    typeof req.query.fileType === "string" ? req.query.fileType : undefined;

  const fileName = headerFileName ?? qFileName;
  const fileType = headerFileType ?? qFileType ?? "application/octet-stream";

  if (!fileName) {
    return res.status(400).json({
      error: "Nom de fichier manquant (x-file-name ou ?fileName=...)",
    });
  }

  try {
    const body = await streamToBuffer(req);

    // --- Clé cohérente avec l’URL publique (préfixe date) ---
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const key = `${today}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: body,
        ContentType: fileType,
        // ACL: "private", // R2 ignore généralement ACL; laisse commenté si inutile
      }),
    );

    // Construit l'URL publique (ex: https://pub-xxxx.r2.dev)
    const publicBase = process.env.R2_PUBLIC_DOMAIN!;
    const publicUrl = `${publicBase}/${key}`;

    return res.status(200).json({ ok: true, key, url: publicUrl });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[upload-proxy] error:", err.message);
      return res.status(500).json({
        error: "Upload R2 échoué",
        details: err.message,
      });
    }
    console.error("[upload-proxy] unknown error:", err);
    return res.status(500).json({
      error: "Upload R2 échoué",
      details: "Unknown error",
    });
  }
}
