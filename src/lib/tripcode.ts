// src/lib/tripcode.ts
import crypto from "crypto";

const serverSalt = process.env.TRIPCODE_SALT || "";

export function getTripcode(secret?: string): string {
  if (!secret || !secret.startsWith("#") || !serverSalt) return "Anonymous";

  const hash = crypto
    .createHash("sha256")
    .update(secret + serverSalt)
    .digest("hex")
    .slice(0, 8);

  return `!${hash}`;
}
