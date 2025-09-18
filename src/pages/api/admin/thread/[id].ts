import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { withAdminAuth } from "@/lib/withAdminAuth";
import { rateLimit } from "@/lib/rateLimit";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function extractKeyFromPublicUrl(url: string): string | null {
  try {
    const base = process.env.R2_PUBLIC_DOMAIN!;
    if (base && url.startsWith(base.replace(/\/$/, "") + "/")) {
      return url.substring(base.replace(/\/$/, "").length + 1);
    }
    const u = new URL(url);
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await connectToDatabase();

  // petit rate-limit pour l'endpoint admin delete
  const ok = await rateLimit(req, res, { windowMs: 60_000, max: 10 });
  if (!ok) return;

  return withAdminAuth(req, res, async () => {
    if (req.method !== "DELETE") {
      return res.status(405).json({ message: "Méthode non autorisée" });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "ID invalide" });
    }

    try {
      // On récupère le document supprimé pour extraire les images
      const deleted = await Thread.findOneAndDelete({ id });
      if (!deleted)
        return res.status(404).json({ message: "Thread introuvable" });

      const bucket = process.env.R2_BUCKET!;
      const keys = new Set<string>();

      // OP + replies
      for (const m of (deleted as any).messages ?? []) {
        if (m?.imageKey && typeof m.imageKey === "string") {
          keys.add(m.imageKey);
          continue;
        }
        if (m?.imageUrl && typeof m.imageUrl === "string") {
          const k = extractKeyFromPublicUrl(m.imageUrl);
          if (k) keys.add(k);
        }
      }

      if (keys.size > 0) {
        const results = await Promise.allSettled(
          Array.from(keys).map((Key) =>
            s3.send(new DeleteObjectCommand({ Bucket: bucket, Key })),
          ),
        );

        const failed = results
          .map((r, i) => ({ r, k: Array.from(keys)[i] }))
          .filter((x) => x.r.status === "rejected")
          .map((x) => ({
            key: x.k,
            error: String((x.r as PromiseRejectedResult).reason),
          }));

        if (failed.length) {
          console.warn("[ADMIN DELETE WARN] R2 deletions failed", failed);
          return res.status(200).json({
            message:
              "Thread supprimé (certaines images n'ont pas pu être supprimées).",
            failed,
          });
        }
      }

      return res.status(200).json({ message: "Thread supprimé avec succès" });
    } catch (error) {
      console.error("[ADMIN DELETE ERROR]", error);
      return res.status(500).json({ message: "Erreur interne serveur" });
    }
  });
}
