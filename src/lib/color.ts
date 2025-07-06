/**
 * Génère une couleur unique à partir d'un tripcode.
 * Si tripcode est "Anonymous", une couleur neutre est utilisée.
 */
export function getTripColor(trip: string): string {
  if (!trip || trip === "Anonymous") return "#888";

  const hash = Array.from(trip).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 55%)`;
}
