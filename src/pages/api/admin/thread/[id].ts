import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { Thread } from "@/models/Thread";
import { withAdminAuth } from "@/lib/withAdminAuth";
import { rateLimit } from "@/lib/rateLimit";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// S3 client for Cloudflare R2 (S3-compatible)
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
    const publicBase = process.env.R2_PUBLIC_DOMAIN!;
    if (publicBase && url.startsWith(publicBase + "/")) {
      return url.substring(publicBase.length + 1);
    }
    const u = new URL(url);
    // Remove leading '/'
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

  // Rate limit: 5 req/min
  const ok = await rateLimit(req, res, { windowMs: 60_000, max: 5 });
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
      // Delete thread in DB but keep returned document to get image URLs
      const deletedThread = await Thread.findOneAndDelete({ id });
      if (!deletedThread) {
        return res.status(404).json({ message: "Thread introuvable" });
      }

      // Collect all image URLs from messages (if any)
      type MinimalMessage = { imageUrl?: string | null };
      const messages = (deletedThread as unknown as { messages?: MinimalMessage[] })
        .messages ?? [];

      const urls: string[] = Array.isArray(messages)
        ? messages
            .map((m) => m?.imageUrl)
            .filter((u): u is string => typeof u === "string" && u.length > 0)
        : [];

      // Map to keys and deduplicate
      const keys = Array.from(
        new Set(
          urls
            .map((u) => extractKeyFromPublicUrl(u))
            .filter((k): k is string => !!k),
        ),
      );

      const bucket = process.env.R2_BUCKET!;
      const deletions = await Promise.allSettled(
        keys.map((Key) => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))),
      );

      const failed: { key: string; error: string }[] = [];
      deletions.forEach((res, i) => {
        if (res.status === "rejected") {
          failed.push({ key: keys[i], error: String(res.reason) });
        }
      });

      if (failed.length > 0) {
        console.warn("[ADMIN DELETE WARN] Some R2 deletions failed", failed);
        return res.status(200).json({
          message:
            "Thread supprimé. Certaines images n'ont pas pu être supprimées du stockage.",
          failed,
        });
      }

      return res.status(200).json({ message: "Thread supprimé avec succès" });
    } catch (error) {
      console.error("[ADMIN DELETE ERROR]", error);
      return res.status(500).json({ message: "Erreur interne serveur" });
    }
  });
}
