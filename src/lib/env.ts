import { z } from "zod";

/**
 * ⚠️ Ce module doit être importé UNIQUEMENT côté serveur (API/lib),
 * pas dans du code rendu côté client.
 *
 * Idée : on valide au chargement seulement ce qui est vraiment requis partout
 * (Mongo + NODE_ENV). Le reste (JWT, R2, TRIPCODE…) est validé à la demande
 * via des getters stricts qui lèvent une erreur si la feature est utilisée
 * sans les variables nécessaires.
 */

const BaseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI est requis"),

  // Optionnels au chargement global ; validés à la demande.
  JWT_SECRET: z.string().optional(),
  TRIPCODE_SALT: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // R2 optionnels ici : on validera quand on fera un upload
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_DOMAIN: z.string().optional(), // ex: https://pub-xxxx.r2.dev ou https://cdn.todomaine.fr
});

const parsed = BaseSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  TRIPCODE_SALT: process.env.TRIPCODE_SALT,

  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_DOMAIN: process.env.R2_PUBLIC_DOMAIN,
});

if (!parsed.success) {
  console.error(
    "❌ Erreur de validation des variables d'environnement (base) :",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Variables d'environnement invalides (base)");
}

export const ENV = parsed.data;

/** Toujours requis partout */
export function getMongoUri(): string {
  return ENV.MONGODB_URI;
}

/** Requis quand on fait de l’auth admin (JWT). */
export function requireJwtSecret(): string {
  if (!ENV.JWT_SECRET) throw new Error("JWT_SECRET manquant");
  return ENV.JWT_SECRET;
}

/** Requis uniquement quand on génère/valide des tripcodes. */
export function requireTripcodeSalt(): string {
  if (!ENV.TRIPCODE_SALT) throw new Error("TRIPCODE_SALT manquant");
  return ENV.TRIPCODE_SALT;
}

/**
 * Requis uniquement pour l’UPLOAD R2.
 * Retourne l’ensemble des infos utiles (endpoint déduit via ACCOUNT_ID).
 */
export function requireR2Config() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_DOMAIN,
  } = ENV;

  const missing: string[] = [];
  if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET) missing.push("R2_BUCKET");
  if (!R2_PUBLIC_DOMAIN) missing.push("R2_PUBLIC_DOMAIN");

  if (missing.length) {
    throw new Error(`Config R2 manquante: ${missing.join(", ")}`);
  }

  const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  return {
    endpoint: R2_ENDPOINT,
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    bucket: R2_BUCKET!,
    publicDomain: R2_PUBLIC_DOMAIN!.replace(/\/$/, ""),
  };
}
