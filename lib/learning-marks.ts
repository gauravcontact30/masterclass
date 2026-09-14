export const MARKER_COLORS = [
  { id: "yellow", label: "Yellow", hex: "#fde68a" },
  { id: "amber", label: "Amber", hex: "#fcd34d" },
  { id: "orange", label: "Orange", hex: "#fdba74" },
  { id: "coral", label: "Coral", hex: "#fca5a5" },
  { id: "pink", label: "Pink", hex: "#f9a8d4" },
  { id: "purple", label: "Purple", hex: "#d8b4fe" },
  { id: "lavender", label: "Lavender", hex: "#c4b5fd" },
  { id: "blue", label: "Blue", hex: "#93c5fd" },
  { id: "cyan", label: "Cyan", hex: "#67e8f9" },
  { id: "teal", label: "Teal", hex: "#5eead4" },
  { id: "green", label: "Green", hex: "#86efac" },
  { id: "lime", label: "Lime", hex: "#bef264" },
] as const;
export type MarkerColor = typeof MARKER_COLORS[number]["id"];
export type TextAnchor = { quote: string; prefix: string; suffix: string; start: number; end: number };
export type LearningMark = TextAnchor & { id: string; contentKey: string; kind: "highlight" | "delete"; color: MarkerColor; updatedAt: string };

// Titles and technology identifiers are shared by the directory and guide readers.
export function learningContentKey(technology: string, title: string, language = "en") {
  const text = `${technology}:${language}:${title.normalize("NFC").trim().toLowerCase()}`;
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `learning-v1:${(a >>> 0).toString(16)}:${(b >>> 0).toString(16)}`;
}
export function anchorText(text: string, start: number, end: number): TextAnchor {
  return { quote: text.slice(start, end), prefix: text.slice(Math.max(0, start - 48), start), suffix: text.slice(end, end + 48), start, end };
}
export function locateAnchor(text: string, anchor: TextAnchor): { start: number; end: number } | null {
  if (!anchor.quote) return null;
  const candidates: { start: number; end: number; score: number }[] = [];
  for (let start = text.indexOf(anchor.quote); start !== -1; start = text.indexOf(anchor.quote, start + 1)) {
    const end = start + anchor.quote.length;
    const score = Number(!!anchor.prefix && text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix) + Number(!!anchor.suffix && text.slice(end, end + anchor.suffix.length) === anchor.suffix);
    candidates.push({ start, end, score });
  }
  if (candidates.length === 1) return candidates[0];
  const sorted = candidates.sort((a, b) => b.score - a.score);
  if (sorted[0]?.score > (sorted[1]?.score ?? 0)) return sorted[0];
  // Unchanged full context can disambiguate identical repeated sentences by offset.
  return sorted.find(item => item.start === anchor.start && item.score === 2) ?? null;
}
