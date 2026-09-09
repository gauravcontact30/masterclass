/*
 * Document themes. The first four keys of each theme are the original contract
 * (background / foreground / accent / muted) and are still what the app-shell
 * document covers key off. The rest drive the artistic page archetypes in
 * render.ts: a second accent for emphasis, a surface for panels, and a motif
 * that decides which generated geometry a cover or section opener draws.
 */
export const themes = {
  minimal: { background: "F8F9FE", foreground: "17213B", accent: "6546D7", muted: "56617A", accent2: "E0A94A", surface: "EDEBFA", motif: "grid" },
  corporate: { background: "FFFFFF", foreground: "152B42", accent: "006D77", muted: "476275", accent2: "B8842B", surface: "E8F2F3", motif: "arcs" },
  cyberpunk: { background: "101322", foreground: "EEF3FF", accent: "00DCE8", muted: "B1BED8", accent2: "FF4D9D", surface: "1A2038", motif: "scan" },
} as const;
export type ThemeName = keyof typeof themes;
export type DocumentTheme = (typeof themes)[ThemeName];
export const documentFont = "Noto Sans Devanagari";
