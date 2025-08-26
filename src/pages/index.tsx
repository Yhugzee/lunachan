import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTripColor } from "@/lib/color";
import type { Thread } from "@/types/thread";

function randomName(ext = "") {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  const id = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
  const day = new Date().toISOString().slice(0, 10);
  return `${day}/${id}${ext ? `.${ext}` : ""}`;
}

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [trip, setTrip] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();

  // Charger les threads
  useEffect(() => {
    fetch("/api/threads")
      .then((res) => res.json())
      .then(setThreads)
      .catch(() => {});
  }, []);

  // Création thread
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    let imageUrl: string | undefined;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "";
      const key = randomName(ext);

      const r = await fetch("/api/upload-proxy", {
        method: "POST",
        headers: {
          "x-file-key": key,
          "x-file-type": imageFile.type || "application/octet-stream",
        },
        body: imageFile,
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        alert(`Échec upload R2: ${r.status} ${txt}`);
        return;
      }

      const { url } = await r.json();
      imageUrl = url;
    }

    // Envoi du thread avec imageUrl (si présent)
    const res = await fetch("/api/thread/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, trip, imageUrl }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      router.push(`/thread/${data.id}`);
    } else {
      alert("Création du thread échouée");
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
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          style={{ marginBottom: "0.5rem" }}
        />
        <span
          className="trip-help"
          aria-label="Aide tripcode"
          role="note"
          tabIndex={0}
        >
          ?
          <span className="tooltip">
            Un tripcode est une signature générée à partir d’un mot de passe
            écrit après un « # » dans ce champ. Il permet d’identifier le même
            auteur sans créer de compte. Exemple : entrez « #monSecret » et
            votre message affichera un tripcode du type « !abc123… ». N’utilisez
            pas de mots de passe importants !
          </span>
        </span>
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
                <strong style={{ cursor: "pointer", color: "white" }}>
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
                      {tripcode.replace(/^!+/, "!")}
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
