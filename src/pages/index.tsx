import Link from "next/link";
import { useEffect, useState } from "react";

type Board = {
  key: string;
  name: string;
  description?: string;
  isNSFW?: boolean;
};

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/boards")
      .then((res) => res.json())
      .then(setBoards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Lunachan 🌙</h1>
      <p>Choisis un board pour parcourir ou créer un thread :</p>

      {loading && <p>Chargement des boards…</p>}

      {!loading && (
        <ul>
          {boards.map((b) => (
            <li key={b.key} style={{ marginBottom: "1rem" }}>
              <Link href={`/${b.key}`}>
                <strong style={{ cursor: "pointer" }}>
                  /{b.key}/ — {b.name}
                </strong>
              </Link>
              {b.description && <p style={{ margin: 0 }}>{b.description}</p>}
              {b.isNSFW && <span style={{ color: "red" }}>NSFW 🔞</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
