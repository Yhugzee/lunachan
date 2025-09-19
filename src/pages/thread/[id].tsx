import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTripColor } from "@/lib/color";
import { tripcodeFromInput } from "@/lib/tripcode";

type Message = {
  id: string;
  content?: string;
  createdAt: string;
  tripcode?: string;
  imageUrl?: string;
  imageKey?: string;
  mimeType?: string;
  size?: number;
};

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  boardKey: string;
  messages: Message[];
};

type PostReplyOk = { message: Message };
type PostReplyErr = { message?: string; error?: string };

// ✅ Pas de `any`, on utilise Record<string, unknown> + garde de types
function isPostReplyOk(v: unknown): v is PostReplyOk {
  if (typeof v !== "object" || v === null) return false;

  const rec = v as Record<string, unknown>;
  const msg = rec["message"];

  if (typeof msg !== "object" || msg === null) return false;

  const m = msg as Record<string, unknown>;
  return typeof m["id"] === "string";
}

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  // Form reply
  const [content, setContent] = useState("");
  const [tripInput, setTripInput] = useState(""); // ex: "#monSecret" → tripcode "!xxxx"
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const resp = await fetch(`/api/thread/${id}`);
        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          console.error("Fetch thread failed:", resp.status, t);
          alert("Impossible de charger le thread.");
          setLoading(false);
          return;
        }
        const th = (await resp.json()) as Thread;
        setThread(th);
      } catch (e) {
        console.error(e);
        alert("Impossible de charger le thread.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!thread || sending) return;
    if (!content && !file) {
      alert("Écris un message ou joins une image.");
      return;
    }

    setSending(true);

    let imagePayload:
      | { imageUrl: string; imageKey: string; mimeType: string; size: number }
      | undefined;

    try {
      // 1) Upload image (optionnel)
      if (file) {
        const presign = await fetch("/api/upload/create-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type || "application/octet-stream",
            size: file.size,
            board: thread.boardKey, // ranger par board dans R2
          }),
        });
        if (!presign.ok) {
          const t = await presign.text().catch(() => "");
          console.error("Presign failed:", t);
          alert("Impossible de préparer l’upload.");
          setSending(false);
          return;
        }
        const { uploadUrl, key, imageUrl } = (await presign.json()) as {
          uploadUrl: string;
          key: string;
          imageUrl: string;
        };

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) {
          const t = await put.text().catch(() => "");
          console.error("Upload R2 failed:", put.status, t);
          alert("Échec de l’upload image.");
          setSending(false);
          return;
        }

        imagePayload = {
          imageUrl,
          imageKey: key,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        };
      }

      // 2) Tripcode (optionnel)
      const tripcode = tripInput ? tripcodeFromInput(tripInput) : undefined;

      // 3) POST reply
      const resp = await fetch(`/api/thread/${thread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          tripcode,
          ...(imagePayload || {}),
        }),
      });

      const data = (await resp.json().catch(() => null)) as
        | PostReplyOk
        | PostReplyErr
        | null;

      if (!resp.ok) {
        const base = (data ?? {}) as Record<string, unknown>;
        const msg =
          (typeof base.message === "string" && base.message) ||
          (typeof base.error === "string" && base.error) ||
          "Réponse échouée";
        alert(String(msg));
        setSending(false);
        return;
      }

      // 4) MAJ instantanée du state (type strict)
      if (isPostReplyOk(data)) {
        const added: Message = data.message;
        setThread((prev) =>
          prev ? { ...prev, messages: [...prev.messages, added] } : prev,
        );
      } else {
        console.warn("Unexpected POST reply payload:", data);
        alert("Format de réponse inattendu.");
        setSending(false);
        return;
      }

      setContent("");
      setTripInput("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main style={{ padding: "2rem" }}>Chargement…</main>;
  if (!thread)
    return <main style={{ padding: "2rem" }}>Thread introuvable.</main>;

  const op = thread.messages[0];

  return (
    <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <p style={{ marginBottom: "1rem" }}>
        <Link href={`/${thread.boardKey}`}>← Retour /{thread.boardKey}/</Link>
      </p>

      <h1>{thread.title}</h1>
      <small>Créé le {new Date(thread.createdAt).toLocaleString()}</small>

      {/* OP */}
      <article
        style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
        }}
      >
        {op?.imageUrl && (
          <Image
            src={op.imageUrl}
            alt=""
            width={480}
            height={480}
            style={{
              width: 480,
              height: "auto",
              display: "block",
              marginBottom: 8,
            }}
          />
        )}
        {op?.content && <p style={{ whiteSpace: "pre-wrap" }}>{op.content}</p>}
        {op?.tripcode && (
          <code style={{ color: getTripColor(op.tripcode) }}>
            {op.tripcode.replace(/^!+/, "!")}
          </code>
        )}
      </article>

      {/* Replies */}
      <section style={{ marginTop: "1.5rem" }}>
        <h3>Réponses</h3>
        {thread.messages.slice(1).map((m) => (
          <div
            key={m.id}
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {m.imageUrl && (
              <Image
                src={m.imageUrl}
                alt=""
                width={420}
                height={420}
                style={{
                  width: 420,
                  height: "auto",
                  display: "block",
                  marginBottom: 6,
                }}
              />
            )}
            {m.content && (
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            )}
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {m.tripcode && (
                <code
                  style={{ color: getTripColor(m.tripcode), marginRight: 8 }}
                >
                  {m.tripcode.replace(/^!+/, "!")}
                </code>
              )}
              {new Date(m.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </section>

      {/* Form reply */}
      <form onSubmit={handleReply} style={{ marginTop: "1.5rem" }}>
        <textarea
          placeholder="Ta réponse…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: "0.5rem", marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <input
            type="text"
            placeholder="Tripcode (ex: #monSecret)"
            value={tripInput}
            onChange={(e) => setTripInput(e.target.value)}
            style={{ flex: 1, padding: "0.5rem" }}
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={sending}>
          {sending ? "Envoi…" : "Répondre"}
        </button>
      </form>
    </main>
  );
}
