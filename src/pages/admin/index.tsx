import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Thread } from "@/types/thread";

interface AdminBoard {
  _id: string;
  key: string;
  name: string;
  description?: string;
  isNSFW?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
  const [boards, setBoards] = useState<AdminBoard[]>([]);

  // Vérifie la présence du cookie d'auth au chargement
  useEffect(() => {
    const token = Cookies.get("admin-auth");
    if (token) {
      setAuthenticated(true);
    }
  }, []);

  // Charge les threads et les boards après authentification
  useEffect(() => {
    if (authenticated) {
      // Threads
      fetch("/api/admin/threads", {
        headers: {
          Authorization: `Bearer ${Cookies.get("admin-auth")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setThreads(Array.isArray(data) ? data : data.threads || []);
        })
        .catch(() => {});

      // Boards
      fetch("/api/admin/boards", {
        headers: {
          Authorization: `Bearer ${Cookies.get("admin-auth")}`,
        },
      })
        .then((res) => res.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) setBoards(data as AdminBoard[]);
        })
        .catch(() => {});
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

  // Handlers Boards
  const onBoardChange = (idx: number, patch: Partial<AdminBoard>) => {
    setBoards((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch } as AdminBoard;
      return copy;
    });
  };

  const saveBoard = async (b: AdminBoard, idx: number) => {
    const res = await fetch(`/api/admin/board/${encodeURIComponent(b.key)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("admin-auth")}`,
      },
      body: JSON.stringify({
        name: b.name,
        description: b.description ?? "",
        isNSFW: !!b.isNSFW,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Échec de la mise à jour: ${t || res.statusText}`);
      return;
    }
    const updated = (await res.json()) as AdminBoard;
    setBoards((prev) => {
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  };

  // === UI admin ===
  return (
    <main className="admin-root" style={{ padding: "2rem" }}>
      <h1>🎛️ Panel Admin</h1>
      <div className="admin-actions">
        <Link href="/">
          <button className="logout-button">
            🏠 Accueil
          </button>
        </Link>
        <button onClick={handleLogout} className="logout-button">
          🔓 Déconnexion
        </button>
      </div>

      <section style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <h2>📋 Boards</h2>
        {boards.length === 0 && <p>Aucun board.</p>}
        <ul>
          {boards.map((b, idx) => (
            <li key={b._id} style={{ marginBottom: "1rem", backgroundColor: "#1f2937", color: "#e5e7eb", border: "1px solid #374151", padding: "0.75rem", borderRadius: 6 }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <code>/{b.key}/</code>
                <label>
                  Nom: {" "}
                  <input
                    value={b.name}
                    onChange={(e) => onBoardChange(idx, { name: e.target.value })}
                    style={{ padding: "0.25rem" }}
                  />
                </label>
                <label>
                  Description: {" "}
                  <input
                    value={b.description || ""}
                    onChange={(e) => onBoardChange(idx, { description: e.target.value })}
                    style={{ padding: "0.25rem", width: 300 }}
                  />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!b.isNSFW}
                    onChange={(e) => onBoardChange(idx, { isNSFW: e.target.checked })}
                  />
                  NSFW
                </label>
                <button onClick={() => saveBoard(b, idx)} className="admin-button">💾 Enregistrer</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <h2>🧵 Threads récents</h2>
      <ul>
        {threads.map((thread) => (
          <li key={thread.id} style={{ marginBottom: "1.5rem" }}>
            <strong>{thread.title}</strong> ({thread.messages.length} messages)
            <br />
            <small>{new Date(thread.createdAt).toLocaleString()}</small>
            <br />
            {thread.boardKey && (
              <small>
                Board: <Link href={`/${thread.boardKey}`}>/{thread.boardKey}/</Link>
              </small>
            )}
            {!thread.boardKey && <small>Board: inconnu</small>}
            <br />
            <Link href={`/thread/${thread.id}`} target="_blank" rel="noopener noreferrer">
              <button className="admin-button">🔍 Voir</button>
            </Link>
            <button className="delete-button" onClick={() => handleDeleteThread(thread.id)}>
              🗑 Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
