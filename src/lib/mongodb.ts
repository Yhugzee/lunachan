import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD;
if (!MONGODB_URI) {
  throw new Error(
    "⚠️ MONGODB_URI non défini dans les variables d'environnement",
  );
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log(
          `✅ Connecté à MongoDB (${process.env.NODE_ENV}) - DB: ${mongooseInstance.connection.name}`,
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
