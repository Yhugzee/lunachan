import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI est requis"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET est requis"),
  TRIPCODE_SALT: z.string().min(1, "TRIPCODE_SALT est requis"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsed = EnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  TRIPCODE_SALT: process.env.TRIPCODE_SALT,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  console.error("❌ Erreur de validation des variables d'environnement:", parsed.error.flatten().fieldErrors);
  throw new Error("Variables d'environnement invalides");
}

export const ENV = parsed.data;

export function getMongoUri(): string {
  return ENV.MONGODB_URI;
}
