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

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;

  const [thread, setThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Charger le thread spécifique
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
      body: JSON.stringify({ content: newMessage }),
    });

    const updatedThread = await res.json();
    setThread(updatedThread);
    setNewMessage("");
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
          <li key={msg.id} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <small>ID: {msg.id}</small>
              <small>{new Date(msg.createdAt).toLocaleString()}</small>
            </div>
            <p style={{ marginTop: "0.4rem" }}>{msg.content}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handlePostMessage} style={{ marginTop: "2rem" }}>
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
