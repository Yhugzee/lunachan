import { useEffect, useState } from "react";

type Thread = {
  id: string;
  title: string;
  createdAt: string;
};

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧠 Charger les threads au chargement de la page
  useEffect(() => {
    fetch("/api/threads")
      .then((res) => res.json())
      .then((data) => setThreads(data));
  }, []);

  // 🧩 Créer un nouveau thread
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);

    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });

    const newThread = await res.json();
    setThreads((prev) => [newThread, ...prev]);
    setNewTitle("");
    setLoading(false);
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Lunachan 🌙</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Titre du thread"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ padding: "0.5rem", width: "80%", marginRight: "1rem" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer"}
        </button>
      </form>

      {threads.length === 0 ? (
        <p>Aucun thread pour le moment.</p>
      ) : (
        <ul>
          {threads.map((thread) => (
            <li key={thread.id}>
              <strong>{thread.title}</strong> <br />
              <small>{new Date(thread.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
