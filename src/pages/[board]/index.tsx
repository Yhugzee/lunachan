import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTripColor } from "@/lib/color";
import { tripcodeFromInput } from "@/lib/tripcode";
import type { Thread } from "@/types/thread";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export default function BoardPage() {
  const router = useRouter();
  const { board } = router.query as { board?: string };

  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [trip, setTrip] = useState(""); // input brut (ex: "#monSecret")
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les threads du board courant
  useEffect(() => {
    if (!board) return;
    fetch(`/api/boards/${board}/threads`)
      .then((res) => res.json())
      .then(setThreads)
      .catch((e: unknown) => {
        console.error("GET /api/boards/[key]/threads failed:", e);
      });
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
        // 1) Presign pour upload direct R2
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
          const t = await presignRes.text().catch(() => "");
          alert(`Presign failed: ${t || presignRes.statusText}`);
          setLoading(false);
          return;
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
          const t = await putRes.text().catch(() => "");
          alert(`Upload R2 failed: ${putRes.status} ${t || putRes.statusText}`);
          setLoading(false);
          return;
        }

        imagePayload = {
          imageUrl,
          imageKey: key,
          mimeType: imageFile.type || "application/octet-stream",
          size: imageFile.size,
        };
      }

      // 3) Création du thread
      const tripcode = trip ? tripcodeFromInput(trip) : undefined;

      const res = await fetch(`/api/boards/${board}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          trip: tripcode, // l’API posera ça dans messages[0].tripcode
          ...(imagePayload || {}),
        }),
      });

      const data = await res.json().catch(() => ({}) as unknown);
      if (!res.ok) {
        const msg =
          (data as { message?: string })?.message ||
          res.statusText ||
          "Création du thread échouée";
        alert(msg);
        setLoading(false);
        return;
      }

      // Reset + prepend + redirection
      setTitle("");
      setContent("");
      setTrip("");
      setImageFile(null);
      setThreads((prev) => [data as Thread, ...prev]);
      router.push(`/thread/${(data as Thread).id}`);
    } catch (e: unknown) {
      alert(errMsg(e));
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
          placeholder="Tripcode (optionnel, ex: #monSecret)"
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
            Un tripcode est une signature générée après un « # ». Exemple : «
            #monSecret » → « !abc123… ». N’utilise pas un vrai mot de passe !
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
                <div style={{ marginTop: "0.5rem", width: 320 }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 0,
                      paddingBottom: "62.5%",
                    }}
                  >
                    <Image
                      src={firstMsg.imageUrl}
                      alt=""
                      fill
                      sizes="320px"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
