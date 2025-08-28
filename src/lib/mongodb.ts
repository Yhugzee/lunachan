import mongoose, { Mongoose } from "mongoose";
import { ENV, getMongoUri } from "./env";

/**
 * Gestion centralisée de la connexion MongoDB avec mise en cache.
 * - Évite d'ouvrir plusieurs connexions en dev (hot reload Next.js).
 * - Partage la même promesse de connexion entre appels concurrents.
 */
const MONGODB_URI = getMongoUri();

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Déclare un cache global (attaché à `global`) pour survivre aux rechargements en dev.
// En production (Vercel), le process est éphémère mais ce cache reste inoffensif/utile.
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

/**
 * Ouvre (ou réutilise) une connexion MongoDB.
 * Retourne toujours la même instance Mongoose pour la durée du process.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        // Désactive le buffering de commandes si la DB est down, pour échouer vite et proprement
        bufferCommands: false,
        // Limite le temps de sélection de serveur pour éviter un long blocage
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log(
          `✅ Connecté à MongoDB (${ENV.NODE_ENV}) - DB: ${mongooseInstance.connection.name}`,
        );
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ Erreur de connexion MongoDB:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  global.mongooseCache = cached;

  return cached.conn;
}
