import crypto from "crypto";
import { ENV } from "./env";

/**
 * Salt côté serveur utilisé pour générer un tripcode stable et non réversible.
 * Doit être secret et différent entre environnements.
 */
const serverSalt = ENV.TRIPCODE_SALT || "";

/**
 * Génère un tripcode à partir d'un secret fourni par l'utilisateur.
 * - Le secret doit commencer par "#" (ex: "#monSecret").
 * - Retourne `undefined` si le format est invalide ou si le salt serveur est absent.
 */
export function getTripcode(secret?: string): string | undefined {
  if (!secret || !secret.startsWith("#") || !serverSalt) return undefined;

  const hash = crypto
    .createHash("sha256")
    .update(secret + serverSalt)
    .digest("hex")
    .slice(0, 8);

  return `!${hash}`;
}
