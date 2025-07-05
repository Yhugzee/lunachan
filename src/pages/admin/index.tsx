import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Thread } from "@/types/thread";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [remember, setRemember] = useState(false); // ✅ nouvelle case à cocher

  // ✅ Check du cookie si déjà connecté
  useEffect(() => {
    const saved = Cookies.get("admin-auth");
    if (saved && saved === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPassword(saved);
    }
  }, []);

  // 🔄 Charge les threads si connecté
  useEffect(() => {
    if (authenticated && password) {
      fetch("/api/admin/threads", {
        headers: {
          Authorization: `Bearer ${password}`,
        },
      })
        .then((res) => res.json())
        .then(setThreads);
    }
  }, [authenticated, password]);

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);

      if (remember) {
        Cookies.set("admin-auth", password, { expires: 7 }); // Cookie 7 jours
      } else {
        Cookies.set("admin-auth", password); // Cookie session
      }
    } else {
      alert("Mot de passe incorrect");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleLogout = () => {
    Cookies.remove("admin-auth");
    setAuthenticated(false);
    setPassword("");
  };

  const handleDeleteThread = async (id: string) => {
    if (!confirm("Es-tu sûr de vouloir supprimer ce thread ?")) return;

    const res = await fetch(`/api/admin/thread/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD}`,
      },
    });

    if (res.ok) {
      setThreads((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Erreur lors de la suppression.");
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
          onKeyDown={handleKeyDown}
          placeholder="Mot de passe admin"
          style={{ padding: "0.5rem", marginBottom: "0.5rem", width: "100%" }}
        />
        <label style={{ display: "block", marginBottom: "1rem" }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ marginRight: "0.5rem" }}
          />
          Rester connecté
        </label>
        <button onClick={handleLogin}>Se connecter</button>
      </main>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>🎛️ Panel Admin</h1>
      <button onClick={handleLogout} className="logout-button">
        🔓 Déconnexion
      </button>

      <ul>
        {threads.map((thread) => (
          <li key={thread.id} style={{ marginBottom: "1.5rem" }}>
            <strong>{thread.title}</strong> ({thread.messages.length} messages)
            <br />
            <small>{new Date(thread.createdAt).toLocaleString()}</small>
            <br />
            <Link
              href={`/thread/${thread.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="admin-button">🔍 Voir</button>
            </Link>
            <button
              className="delete-button"
              onClick={() => handleDeleteThread(thread.id)}
            >
              🗑 Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
