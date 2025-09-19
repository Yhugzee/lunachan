import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import type { IThread, IMessage } from "@/models/Thread";
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
    if (base) {
      const normalized = base.replace(/\/$/, "");
      if (url.startsWith(normalized + "/")) {
        return url.substring(normalized.length + 1);
      }
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
      // récupère le doc supprimé (typage strict)
      const deleted = await Thread.findOneAndDelete({
        id,
      }).lean<IThread | null>();
      if (!deleted)
        return res.status(404).json({ message: "Thread introuvable" });

      // collecte des clés d’objets à supprimer (OP + replies)
      const keys = new Set<string>();
      (deleted.messages ?? []).forEach((m: IMessage) => {
        if (m.imageKey) {
          keys.add(m.imageKey);
        } else if (m.imageUrl) {
          const k = extractKeyFromPublicUrl(m.imageUrl);
          if (k) keys.add(k);
        }
      });

      if (keys.size > 0) {
        const bucket = process.env.R2_BUCKET as string;

        const results = await Promise.allSettled(
          Array.from(keys).map((Key) =>
            s3.send(new DeleteObjectCommand({ Bucket: bucket, Key })),
          ),
        );

        const failed = results
          .map((r, i) => ({ r, k: Array.from(keys)[i] }))
          .filter(
            (x): x is { r: PromiseRejectedResult; k: string } =>
              x.r.status === "rejected",
          );

        if (failed.length) {
          console.warn("[ADMIN DELETE WARN] R2 deletions failed", failed);
          return res.status(200).json({
            message:
              "Thread supprimé (certaines images n'ont pas pu être supprimées).",
            failed: failed.map((f) => ({
              key: f.k,
              error: String(f.r.reason),
            })),
          });
        }
      }

      return res.status(200).json({ message: "Thread supprimé avec succès" });
    } catch (error) {
      console.error("[ADMIN DELETE ERROR]", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  });
}
