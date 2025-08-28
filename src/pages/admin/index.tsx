import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Thread } from "@/types/thread";

/**
 * Page d'administration minimale:
 * - Gère une session via un cookie JWT ("admin-auth").
 * - Liste les threads après authentification.
 * - Permet de supprimer un thread.
 */
export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);

  // Vérifie la présence du cookie d'auth au chargement
  useEffect(() => {
    const token = Cookies.get("admin-auth");
    if (token) {
      setAuthenticated(true);
    }
  }, []);

  // Charge les threads après authentification
  useEffect(() => {
    if (authenticated) {
      fetch("/api/admin/threads", {
        headers: {
          Authorization: `Bearer ${Cookies.get("admin-auth")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setThreads(Array.isArray(data) ? data : data.threads || []);
        });
    }
  }, [authenticated]);

  const handleLogin = async () => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      Cookies.set("admin-auth", data.token, { expires: 7 });
      setAuthenticated(true);
      // Recharge la page pour relancer la récupération des threads
      window.location.reload();
    } else {
      alert("Échec de la connexion : identifiants invalides.");
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
    setUsername("");
    setPassword("");
  };

  const handleDeleteThread = async (id: string) => {
    if (!confirm("Es-tu sûr de vouloir supprimer ce thread ?")) return;

    const res = await fetch(`/api/admin/thread/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${Cookies.get("admin-auth")}`,
      },
    });

    if (res.ok) {
      setThreads((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Erreur lors de la suppression.");
    }
  };

  // === UI de connexion ===
  if (!authenticated) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>🔐 Connexion Admin</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur"
          style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mot de passe"
          style={{ padding: "0.5rem", marginBottom: "1rem", width: "100%" }}
        />
        <button onClick={handleLogin}>Se connecter</button>
      </main>
    );
  }

  // === UI admin ===
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
