import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

function generateChanId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return timestamp.slice(-7) + random;
}

// Définir le chemin du fichier JSON (racine du projet)
const dataPath = path.join(process.cwd(), "data", "threads.json");

// Typage d’un message individuel
type Message = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
};

// Typage d’un thread
type Thread = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔹 GET : Récupérer tous les threads
  if (req.method === "GET") {
    try {
      const fileData = fs.readFileSync(dataPath, "utf8");
      const threads: Thread[] = JSON.parse(fileData);
      res.status(200).json(threads);
    } catch (error) {
      console.error("Erreur lecture:", error);
      res.status(500).json({ message: "Erreur lecture des threads" });
    }
  }

  // 🔹 POST : Créer un nouveau thread
  else if (req.method === "POST") {
    const { title } = req.body;

    // Vérification simple du titre
    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Titre manquant ou invalide" });
    }

    // Création d’un nouveau thread
    const newThread: Thread = {
      id: generateChanId(),
      title,
      createdAt: new Date().toISOString(),
      messages: [],
    };

    try {
      const fileData = fs.readFileSync(dataPath, "utf8");
      const threads: Thread[] = JSON.parse(fileData);
      threads.unshift(newThread); // On l'ajoute au début de la liste
      fs.writeFileSync(dataPath, JSON.stringify(threads, null, 2), "utf8");
      res.status(201).json(newThread);
    } catch (error) {
      console.error("Erreur écriture:", error);
      res.status(500).json({ message: "Erreur création thread" });
    }
  }

  // 🔺 Autres méthodes non autorisées
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
