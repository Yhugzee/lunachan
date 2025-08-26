import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI est requis"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET est requis"),
  TRIPCODE_SALT: z.string().min(1, "TRIPCODE_SALT est requis"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  // Cloudflare R2 (S3 compatible)
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID est requis"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID est requis"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY est requis"),
  R2_BUCKET: z.string().min(1, "R2_BUCKET est requis"),
  // Domaine public (cf. R2 custom domain ou r2.dev). Exemple: cdn.example.com ou pub-xxx.r2.dev
  R2_PUBLIC_DOMAIN: z.string().min(1, "R2_PUBLIC_DOMAIN est requis"),
});

const parsed = EnvSchema.safeParse({
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
  console.error("❌ Erreur de validation des variables d'environnement:", parsed.error.flatten().fieldErrors);
  throw new Error("Variables d'environnement invalides");
}

export const ENV = parsed.data;

export function getMongoUri(): string {
  return ENV.MONGODB_URI;
}
