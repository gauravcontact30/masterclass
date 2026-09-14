/*
 * Colour themes for the artistic notes exports (the Jupyter notebook and the
 * exporter previews). Colours are six-digit hex WITHOUT a leading "#"; each
 * consumer adds the "#" itself.
 *
 * Every colour a builder puts text in is paired with the background it sits
 * on in contrastPairs() below, and __tests__/artistic-notes-themes.test.ts
 * asserts each pair against WCAG 2.x AA. Builders must only draw text using
 * a pair listed there, so adding a colour means adding its pair.
 */

export const themeNames = ["retro-cyberpunk", "warm-academic", "high-contrast-light", "high-contrast-dark"] as const;
export type ArtisticThemeName = (typeof themeNames)[number];

export type CalloutKind = "definition" | "takeaway" | "warning" | "recall";
/** A callout panel: tinted background, and the colour of its label, icon and edge bar. */
export type CalloutColors = { background: string; label: string };
export type FontStack = { css: string; office: string };

export type ArtisticTheme = {
  name: ArtisticThemeName;
  label: string;
  description: string;
  /** Page ground. */
  background: string;
  /** Raised panels (summary box, recall band, answer key). */
  surface: string;
  /** Body copy. */
  text: string;
  /** Secondary copy: captions, subtitles, page counters. */
  muted: string;
  /** Primary accent: numerals, section numbers, labels, accent bars. */
  accent: string;
  /** Secondary accent: concept labels, second bar segments. */
  accent2: string;
  /** Text drawn on a solid accent fill (badges, chips). */
  onAccent: string;
  codeBackground: string;
  codeText: string;
  /** Decorative hairlines only; never carries text. */
  rule: string;
  callouts: Record<CalloutKind, CalloutColors>;
  fonts: { heading: FontStack; body: FontStack; mono: FontStack };
  /** Headings set in capitals give the loud themes their poster feel. */
  uppercaseHeadings: boolean;
};

// "NotesSans" follows each preferred face so any glyph the display face lacks
// falls back to a font with Latin + Devanagari coverage where one is loaded.
const sans: FontStack = { css: `"NotesSans", Arial, "Nirmala UI", sans-serif`, office: "Arial" };
const mono: FontStack = { css: `Consolas, "SFMono-Regular", Menlo, "NotesSans", monospace`, office: "Consolas" };
const poster: FontStack = { css: `"Arial Black", "Arial Bold", "NotesSans", Arial, sans-serif`, office: "Arial Black" };

export const artisticThemes: Record<ArtisticThemeName, ArtisticTheme> = {
  "retro-cyberpunk": {
    name: "retro-cyberpunk", label: "Retro cyberpunk", description: "Neon cyan and hot pink on deep violet.",
    background: "0D0221", surface: "1C0B3F", text: "F7F3FF", muted: "C9BCF2",
    accent: "00F0FF", accent2: "FF4FA3", onAccent: "0D0221",
    codeBackground: "05010F", codeText: "B8FFE9", rule: "3B1F73",
    callouts: {
      definition: { background: "062A3D", label: "5CF4FF" },
      takeaway: { background: "35093A", label: "FF7AC0" },
      warning: { background: "3A2A00", label: "FFD23F" },
      recall: { background: "0B3A22", label: "5CFF9D" },
    },
    fonts: { heading: poster, body: sans, mono },
    uppercaseHeadings: true,
  },
  "warm-academic": {
    name: "warm-academic", label: "Warm academic", description: "Ink on parchment with burgundy and teal.",
    background: "FBF6EC", surface: "F2E8D5", text: "2B2118", muted: "5C4A38",
    accent: "8B2E3F", accent2: "1D5C57", onAccent: "FFFFFF",
    codeBackground: "2B2118", codeText: "F6EAD3", rule: "D9C7A5",
    callouts: {
      definition: { background: "E6ECF4", label: "22446B" },
      takeaway: { background: "F4E6C8", label: "6E4300" },
      warning: { background: "F7DFD8", label: "8F2415" },
      recall: { background: "DFEDE1", label: "285230" },
    },
    fonts: {
      heading: { css: `Georgia, "Times New Roman", "NotesSans", serif`, office: "Georgia" },
      body: { css: `Georgia, "Times New Roman", "NotesSans", serif`, office: "Georgia" },
      mono,
    },
    uppercaseHeadings: false,
  },
  "high-contrast-light": {
    name: "high-contrast-light", label: "High contrast light", description: "Pure black on white, electric blue accents.",
    background: "FFFFFF", surface: "F1F1F1", text: "000000", muted: "333333",
    accent: "0033CC", accent2: "B3001B", onAccent: "FFFFFF",
    codeBackground: "111111", codeText: "FFFFFF", rule: "000000",
    callouts: {
      definition: { background: "E8EEFF", label: "002699" },
      takeaway: { background: "FFF4CC", label: "5C4200" },
      warning: { background: "FFE5E5", label: "9E0016" },
      recall: { background: "E3F6E8", label: "0B5A26" },
    },
    fonts: { heading: poster, body: sans, mono },
    uppercaseHeadings: false,
  },
  "high-contrast-dark": {
    name: "high-contrast-dark", label: "High contrast dark", description: "White on black with signal-yellow accents.",
    background: "000000", surface: "161616", text: "FFFFFF", muted: "D4D4D4",
    accent: "FFD400", accent2: "33E1FF", onAccent: "000000",
    codeBackground: "0F0F0F", codeText: "E8FFE8", rule: "5A5A5A",
    callouts: {
      definition: { background: "001F33", label: "66D9FF" },
      takeaway: { background: "2E2600", label: "FFE14D" },
      warning: { background: "330A0A", label: "FF8A80" },
      recall: { background: "00260F", label: "5CFF8A" },
    },
    fonts: { heading: poster, body: sans, mono },
    uppercaseHeadings: true,
  },
};

export const defaultThemeName: ArtisticThemeName = "high-contrast-light";

/** WCAG 2.x relative luminance of a six-digit hex colour (with or without "#"). */
export function relativeLuminance(hex: string): number {
  const value = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Invalid colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map(offset => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG AA minimums: 4.5:1 for body text, 3:1 for large text (≥ 24px, or ≥ 18.66px bold). */
export const WCAG_AA = { body: 4.5, large: 3 } as const;
export type ContrastPair = { name: string; foreground: string; background: string; size: keyof typeof WCAG_AA };

/**
 * Every foreground/background combination the builders render text with.
 * "large" is reserved for pairs only ever used at display sizes (the recap
 * numerals); everything else is held to the body-text minimum.
 */
export function contrastPairs(theme: ArtisticTheme): ContrastPair[] {
  const pair = (name: string, foreground: string, background: string, size: ContrastPair["size"] = "body"): ContrastPair => ({ name, foreground, background, size });
  const pairs: ContrastPair[] = [
    pair("text on background", theme.text, theme.background),
    pair("text on surface", theme.text, theme.surface),
    pair("muted on background", theme.muted, theme.background),
    pair("muted on surface", theme.muted, theme.surface),
    pair("accent on background", theme.accent, theme.background),
    pair("accent on surface", theme.accent, theme.surface),
    pair("accent2 on background", theme.accent2, theme.background),
    pair("accent2 on surface (recap numerals)", theme.accent2, theme.surface, "large"),
    pair("onAccent on accent", theme.onAccent, theme.accent),
    pair("code text on code background", theme.codeText, theme.codeBackground),
  ];
  for (const [kind, colors] of Object.entries(theme.callouts)) {
    pairs.push(
      pair(`${kind} label on ${kind} panel`, colors.label, colors.background),
      pair(`text on ${kind} panel`, theme.text, colors.background),
      pair(`muted on ${kind} panel`, theme.muted, colors.background),
    );
  }
  return pairs;
}
