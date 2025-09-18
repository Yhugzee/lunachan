// src/lib/tripcode.ts

/**
 * Transforme une entrée type "#monSecret" en tripcode "!xxxxxx".
 * Pas de sel secret côté client pour éviter d’exposer des secrets.
 * Algo: djb2 -> base36, 8 caractères, préfixe "!".
 */
export function tripcodeFromInput(input?: string): string | undefined {
  if (!input) return undefined;

  // accepte "secret", "#secret" ou "##secret"
  const raw = String(input).replace(/^#+/, "");
  if (!raw) return undefined;

  // djb2 (synchrone, côté client ok)
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
  }
  const code = Math.abs(h >>> 0)
    .toString(36)
    .slice(0, 8);
  return "!" + code;
}
