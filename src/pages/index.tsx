import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTripColor } from "@/lib/color";
import type { Thread } from "@/types/thread";

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [trip, setTrip] = useState("");
  const router = useRouter();

  // Charger les threads depuis l’API
  useEffect(() => {
    fetch("/api/threads")
      .then((res) => res.json())
      .then(setThreads);
  }, []);

  // Soumettre un nouveau thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const res = await fetch("/api/thread/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, trip }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push(`/thread/${data.id}`);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Lunachan 🌙</h1>

      <form onSubmit={handleCreateThread} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Titre du thread"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <textarea
          placeholder="Contenu initial du thread"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Tripcode (optionnel)"
          value={trip}
          onChange={(e) => setTrip(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <button type="submit">Créer un nouveau thread</button>
      </form>

      <h2>🧵 Threads récents</h2>
      <ul>
        {threads.map((thread) => {
          const firstMsg = thread.messages?.[0];
          const tripcode = firstMsg?.tripcode;

          return (
            <li key={thread.id} style={{ marginBottom: "1rem" }}>
              <Link href={`/thread/${thread.id}`}>
                <strong
                  style={{
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  {thread.title}
                  {tripcode && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        color: getTripColor(tripcode),
                        fontSize: "0.9rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {tripcode}
                    </span>
                  )}
                </strong>
              </Link>
              <br />
              <small>{new Date(thread.createdAt).toLocaleString()}</small>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
