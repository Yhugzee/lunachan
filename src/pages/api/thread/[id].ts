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

const dataPath = path.join(process.cwd(), "data", "threads.json");

type Message = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
};

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "ID invalide" });
  }

  // 🟢 GET - Récupérer un thread par son ID
  if (req.method === "GET") {
    try {
      const fileData = fs.readFileSync(dataPath, "utf8");
      const threads: Thread[] = JSON.parse(fileData);
      const thread = threads.find((t) => t.id === id);

      if (!thread)
        return res.status(404).json({ message: "Thread introuvable" });
      res.status(200).json(thread);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lecture thread" });
    }
  }

  // 🟣 POST - Ajouter un message au thread
  else if (req.method === "POST") {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Contenu invalide" });
    }

    try {
      const fileData = fs.readFileSync(dataPath, "utf8");
      const threads: Thread[] = JSON.parse(fileData);
      const threadIndex = threads.findIndex((t) => t.id === id);

      if (threadIndex === -1)
        return res.status(404).json({ message: "Thread non trouvé" });

      const newMessage: Message = {
        id: generateChanId(),
        content,
        createdAt: new Date().toISOString(),
        authorId: "anon-" + Math.floor(Math.random() * 9999),
      };

      threads[threadIndex].messages.push(newMessage);
      fs.writeFileSync(dataPath, JSON.stringify(threads, null, 2), "utf8");

      res.status(201).json(threads[threadIndex]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur ajout message" });
    }
  }

  // 🛑 Méthode non autorisée
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
