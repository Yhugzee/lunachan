import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
};

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

function getTripColor(trip: string): string {
  if (trip === "Anonymous") return "#888"; // Couleur neutre par défaut

  const hash = Array.from(trip).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 55%)`; // Couleur unique générée
}

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;

  const [thread, setThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [tripcodeInput, setTripcodeInput] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/thread/${id}`)
      .then((res) => res.json())
      .then((data) => setThread(data));
  }, [id]);

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/thread/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMessage,
        trip: tripcodeInput,
      }),
    });

    const updatedThread = await res.json();
    setThread(updatedThread);
    setNewMessage("");
    setTripcodeInput(""); // reset si tu veux
  };

  if (!thread) return <p>Chargement...</p>;

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>{thread.title}</h1>
      <small style={{ display: "block", marginBottom: "1rem" }}>
        Thread ID: {thread.id}
      </small>

      <ul>
        {thread.messages.map((msg) => (
          <li key={msg.id} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ color: getTripColor(msg.authorId) }}>
                {msg.authorId}
              </strong>
              <small>{new Date(msg.createdAt).toLocaleString()}</small>
            </div>
            <div style={{ marginTop: "0.4rem" }}>
              <p>{msg.content}</p>
              <small style={{ color: "#888" }}>ID: {msg.id}</small>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handlePostMessage} style={{ marginTop: "2rem" }}>
        <input
          type="text"
          value={tripcodeInput}
          onChange={(e) => setTripcodeInput(e.target.value)}
          placeholder="Tripcode (facultatif, ex: #banane42)"
          style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem" }}
        />
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={4}
          placeholder="Répondre anonymement..."
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <button type="submit" style={{ marginTop: "0.5rem" }}>
          Répondre
        </button>
      </form>
    </main>
  );
}
