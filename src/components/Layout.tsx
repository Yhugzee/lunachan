import Link from "next/link";
import { ReactNode } from "react";

/**
 * Layout générique pour les pages publiques (en-tête simple + conteneur centré).
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#fff" }}>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Lunachan 🌙</h1>
        </Link>
      </header>
      {children}
    </div>
  );
}
