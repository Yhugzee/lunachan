import crypto from "crypto";
import { ENV } from "./env";

const serverSalt = ENV.TRIPCODE_SALT || "";

export function getTripcode(secret?: string): string | undefined {
  if (!secret || !secret.startsWith("#") || !serverSalt) return undefined;

  const hash = crypto
    .createHash("sha256")
    .update(secret + serverSalt)
    .digest("hex")
    .slice(0, 8);

  return `!${hash}`;
}
