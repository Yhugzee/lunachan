import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import type { Thread } from "@/types/thread";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (authenticated) {
      fetch("/api/admin/threads", {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setThreads(data);
        });
    }
  }, [authenticated, password]);

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  if (!authenticated) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>🔒 Accès Admin</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe admin"
          style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
        />
        <button onClick={handleLogin}>Se connecter</button>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>🎛️ Panel Admin</h1>
      <ul>
        {threads.map((thread) => (
          <li key={thread.id} style={{ marginBottom: "1.5rem" }}>
            <strong>{thread.title}</strong> ({thread.messages.length} messages)
            <br />
            <small>{new Date(thread.createdAt).toLocaleString()}</small>
            <br />
            <Link href={`/thread/${thread.id}`}>
              <button style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}>
                🔍 Voir
              </button>
            </Link>
            <button onClick={() => alert("Suppression à venir")}>
              🗑 Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
