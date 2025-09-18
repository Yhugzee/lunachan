import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTripColor } from "@/lib/color";
import type { Thread } from "@/types/thread";

export default function BoardPage() {
  const router = useRouter();
  const { board } = router.query as { board?: string };

  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [trip, setTrip] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les threads du board courant
  useEffect(() => {
    if (!board) return;
    fetch(`/api/boards/${board}/threads`)
      .then((res) => res.json())
      .then(setThreads)
      .catch(() => {});
  }, [board]);

  // Création d'un thread (upload R2 + POST thread)
  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board) return;
    if (!title && !content && !imageFile) return;

    setLoading(true);
    let imagePayload:
      | { imageUrl: string; imageKey: string; mimeType: string; size: number }
      | undefined;

    try {
      if (imageFile) {
        // 1) Demande d'URL pré-signée pour upload direct R2
        const presignRes = await fetch("/api/upload/create-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: imageFile.type || "application/octet-stream",
            size: imageFile.size,
            board, // ranger par board dans R2
          }),
        });
        if (!presignRes.ok) {
          const t = await presignRes.text();
          throw new Error(`Presign failed: ${t}`);
        }
        const { uploadUrl, key, imageUrl } = (await presignRes.json()) as {
          uploadUrl: string;
          key: string;
          imageUrl: string;
        };

        // 2) Upload PUT vers R2
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": imageFile.type || "application/octet-stream",
          },
          body: imageFile,
        });
        if (!putRes.ok) {
          const t = await putRes.text();
          throw new Error(`Upload R2 failed: ${putRes.status} ${t}`);
        }

        imagePayload = {
          imageUrl,
          imageKey: key,
          mimeType: imageFile.type || "application/octet-stream",
          size: imageFile.size,
        };
      }

      // 3) Création du thread dans le board
      const res = await fetch(`/api/boards/${board}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, trip, ...(imagePayload || {}) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Création du thread échouée");
      }

      // Reset + prepend + redirection vers la page du thread si tu veux
      setTitle("");
      setContent("");
      setTrip("");
      setImageFile(null);
      setThreads((prev) => [data as Thread, ...prev]);
      router.push(`/thread/${data.id}`); // adapte si tu veux /[board]/thread/[id]
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!board) return null;

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>/ {board} / – Lunachan 🌙</h1>

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
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          style={{ marginBottom: "0.5rem" }}
        />

        {/* Aide tripcode */}
        <span
          className="trip-help"
          aria-label="Aide tripcode"
          role="note"
          tabIndex={0}
        >
          ?
          <span className="tooltip">
            Un tripcode est une signature générée après un « # ». Il identifie
            un auteur sans compte. Exemple : « #monSecret » → « !abc123… ».
            N’utilise pas un vrai mot de passe !
          </span>
        </span>

        <button type="submit" disabled={loading}>
          {loading ? "Envoi…" : "Créer un nouveau thread"}
        </button>
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

              {firstMsg?.imageUrl && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={firstMsg.imageUrl}
                    alt=""
                    style={{ maxWidth: 320, height: "auto", display: "block" }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
