/**
 * Curated collection of 85+ popular Google Fonts engineered for long-form reading,
 * code/technical typography, and editorial publishing.
 *
 * Used across the Super Admin Notepad and Tech Buzz blog pages for typography customisation.
 */

export type GoogleFontCategory = "Sans-Serif" | "Serif" | "Monospace" | "Display/Creative";

export interface GoogleFontOption {
  id: string;
  name: string;
  category: GoogleFontCategory;
  stack: string;
}

/** 86 authentic, top-ranking Google Fonts curated for clarity, legibility, and reading comfort. */
export const GOOGLE_FONTS_POPULAR: GoogleFontOption[] = [
  // ── Sans-Serif (Modern, Clean & High Legibility) ───────────────
  { id: "roboto", name: "Roboto", category: "Sans-Serif", stack: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: "open-sans", name: "Open Sans", category: "Sans-Serif", stack: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: "inter", name: "Inter", category: "Sans-Serif", stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: "lato", name: "Lato", category: "Sans-Serif", stack: '"Lato", -apple-system, sans-serif' },
  { id: "montserrat", name: "Montserrat", category: "Sans-Serif", stack: '"Montserrat", -apple-system, sans-serif' },
  { id: "poppins", name: "Poppins", category: "Sans-Serif", stack: '"Poppins", -apple-system, sans-serif' },
  { id: "source-sans-3", name: "Source Sans 3", category: "Sans-Serif", stack: '"Source Sans 3", -apple-system, sans-serif' },
  { id: "nunito", name: "Nunito", category: "Sans-Serif", stack: '"Nunito", -apple-system, sans-serif' },
  { id: "nunito-sans", name: "Nunito Sans", category: "Sans-Serif", stack: '"Nunito Sans", -apple-system, sans-serif' },
  { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", category: "Sans-Serif", stack: '"Plus Jakarta Sans", -apple-system, sans-serif' },
  { id: "work-sans", name: "Work Sans", category: "Sans-Serif", stack: '"Work Sans", -apple-system, sans-serif' },
  { id: "raleway", name: "Raleway", category: "Sans-Serif", stack: '"Raleway", -apple-system, sans-serif' },
  { id: "ubuntu", name: "Ubuntu", category: "Sans-Serif", stack: '"Ubuntu", -apple-system, sans-serif' },
  { id: "rubik", name: "Rubik", category: "Sans-Serif", stack: '"Rubik", -apple-system, sans-serif' },
  { id: "dm-sans", name: "DM Sans", category: "Sans-Serif", stack: '"DM Sans", -apple-system, sans-serif' },
  { id: "manrope", name: "Manrope", category: "Sans-Serif", stack: '"Manrope", -apple-system, sans-serif' },
  { id: "mulish", name: "Mulish", category: "Sans-Serif", stack: '"Mulish", -apple-system, sans-serif' },
  { id: "quicksand", name: "Quicksand", category: "Sans-Serif", stack: '"Quicksand", -apple-system, sans-serif' },
  { id: "karla", name: "Karla", category: "Sans-Serif", stack: '"Karla", -apple-system, sans-serif' },
  { id: "barlow", name: "Barlow", category: "Sans-Serif", stack: '"Barlow", -apple-system, sans-serif' },
  { id: "heebo", name: "Heebo", category: "Sans-Serif", stack: '"Heebo", -apple-system, sans-serif' },
  { id: "outfit", name: "Outfit", category: "Sans-Serif", stack: '"Outfit", -apple-system, sans-serif' },
  { id: "figtree", name: "Figtree", category: "Sans-Serif", stack: '"Figtree", -apple-system, sans-serif' },
  { id: "jost", name: "Jost", category: "Sans-Serif", stack: '"Jost", -apple-system, sans-serif' },
  { id: "red-hat-display", name: "Red Hat Display", category: "Sans-Serif", stack: '"Red Hat Display", -apple-system, sans-serif' },
  { id: "red-hat-text", name: "Red Hat Text", category: "Sans-Serif", stack: '"Red Hat Text", -apple-system, sans-serif' },
  { id: "titillium-web", name: "Titillium Web", category: "Sans-Serif", stack: '"Titillium Web", -apple-system, sans-serif' },
  { id: "cabin", name: "Cabin", category: "Sans-Serif", stack: '"Cabin", -apple-system, sans-serif' },
  { id: "arimo", name: "Arimo", category: "Sans-Serif", stack: '"Arimo", -apple-system, sans-serif' },
  { id: "assistant", name: "Assistant", category: "Sans-Serif", stack: '"Assistant", -apple-system, sans-serif' },
  { id: "overpass", name: "Overpass", category: "Sans-Serif", stack: '"Overpass", -apple-system, sans-serif' },
  { id: "urbanist", name: "Urbanist", category: "Sans-Serif", stack: '"Urbanist", -apple-system, sans-serif' },
  { id: "lexend", name: "Lexend", category: "Sans-Serif", stack: '"Lexend", -apple-system, sans-serif' },
  { id: "public-sans", name: "Public Sans", category: "Sans-Serif", stack: '"Public Sans", -apple-system, sans-serif' },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", category: "Sans-Serif", stack: '"IBM Plex Sans", -apple-system, sans-serif' },
  { id: "noto-sans", name: "Noto Sans", category: "Sans-Serif", stack: '"Noto Sans", -apple-system, sans-serif' },

  // ── Serif (Classic Book, Journal & Long-Form Reading) ───────────
  { id: "merriweather", name: "Merriweather", category: "Serif", stack: '"Merriweather", Georgia, serif' },
  { id: "playfair-display", name: "Playfair Display", category: "Serif", stack: '"Playfair Display", Georgia, serif' },
  { id: "lora", name: "Lora", category: "Serif", stack: '"Lora", Georgia, serif' },
  { id: "pt-serif", name: "PT Serif", category: "Serif", stack: '"PT Serif", Georgia, serif' },
  { id: "noto-serif", name: "Noto Serif", category: "Serif", stack: '"Noto Serif", Georgia, serif' },
  { id: "roboto-serif", name: "Roboto Serif", category: "Serif", stack: '"Roboto Serif", Georgia, serif' },
  { id: "source-serif-4", name: "Source Serif 4", category: "Serif", stack: '"Source Serif 4", Georgia, serif' },
  { id: "libre-baskerville", name: "Libre Baskerville", category: "Serif", stack: '"Libre Baskerville", Georgia, serif' },
  { id: "eb-garamond", name: "EB Garamond", category: "Serif", stack: '"EB Garamond", Garamond, Georgia, serif' },
  { id: "cinzel", name: "Cinzel", category: "Serif", stack: '"Cinzel", Georgia, serif' },
  { id: "bitter", name: "Bitter", category: "Serif", stack: '"Bitter", Georgia, serif' },
  { id: "cormorant-garamond", name: "Cormorant Garamond", category: "Serif", stack: '"Cormorant Garamond", Georgia, serif' },
  { id: "crimson-text", name: "Crimson Text", category: "Serif", stack: '"Crimson Text", Garamond, Georgia, serif' },
  { id: "crimson-pro", name: "Crimson Pro", category: "Serif", stack: '"Crimson Pro", Georgia, serif' },
  { id: "spectral", name: "Spectral", category: "Serif", stack: '"Spectral", Georgia, serif' },
  { id: "domine", name: "Domine", category: "Serif", stack: '"Domine", Georgia, serif' },
  { id: "bodoni-moda", name: "Bodoni Moda", category: "Serif", stack: '"Bodoni Moda", Georgia, serif' },
  { id: "frank-ruhl-libre", name: "Frank Ruhl Libre", category: "Serif", stack: '"Frank Ruhl Libre", Georgia, serif' },
  { id: "literata", name: "Literata", category: "Serif", stack: '"Literata", Georgia, serif' },
  { id: "newsreader", name: "Newsreader", category: "Serif", stack: '"Newsreader", Georgia, serif' },
  { id: "cardo", name: "Cardo", category: "Serif", stack: '"Cardo", Georgia, serif' },
  { id: "faustina", name: "Faustina", category: "Serif", stack: '"Faustina", Georgia, serif' },
  { id: "vollkorn", name: "Vollkorn", category: "Serif", stack: '"Vollkorn", Georgia, serif' },
  { id: "marcellus", name: "Marcellus", category: "Serif", stack: '"Marcellus", Georgia, serif' },
  { id: "alegreya", name: "Alegreya", category: "Serif", stack: '"Alegreya", Georgia, serif' },
  { id: "besley", name: "Besley", category: "Serif", stack: '"Besley", Georgia, serif' },
  { id: "castoro", name: "Castoro", category: "Serif", stack: '"Castoro", Georgia, serif' },
  { id: "ibm-plex-serif", name: "IBM Plex Serif", category: "Serif", stack: '"IBM Plex Serif", Georgia, serif' },

  // ── Monospace & Technical (Developer & Code Reading) ───────────
  { id: "roboto-mono", name: "Roboto Mono", category: "Monospace", stack: '"Roboto Mono", monospace' },
  { id: "inconsolata", name: "Inconsolata", category: "Monospace", stack: '"Inconsolata", monospace' },
  { id: "source-code-pro", name: "Source Code Pro", category: "Monospace", stack: '"Source Code Pro", monospace' },
  { id: "space-mono", name: "Space Mono", category: "Monospace", stack: '"Space Mono", monospace' },
  { id: "fira-code", name: "Fira Code", category: "Monospace", stack: '"Fira Code", monospace' },
  { id: "jetbrains-mono", name: "JetBrains Mono", category: "Monospace", stack: '"JetBrains Mono", monospace' },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", category: "Monospace", stack: '"IBM Plex Mono", monospace' },
  { id: "pt-mono", name: "PT Mono", category: "Monospace", stack: '"PT Mono", monospace' },
  { id: "ubuntu-mono", name: "Ubuntu Mono", category: "Monospace", stack: '"Ubuntu Mono", monospace' },
  { id: "dm-mono", name: "DM Mono", category: "Monospace", stack: '"DM Mono", monospace' },
  { id: "cousine", name: "Cousine", category: "Monospace", stack: '"Cousine", monospace' },
  { id: "anonymous-pro", name: "Anonymous Pro", category: "Monospace", stack: '"Anonymous Pro", monospace' },
  { id: "overpass-mono", name: "Overpass Mono", category: "Monospace", stack: '"Overpass Mono", monospace' },
  { id: "red-hat-mono", name: "Red Hat Mono", category: "Monospace", stack: '"Red Hat Mono", monospace' },

  // ── Display & Creative (Headings, Handwriting & Accents) ───────
  { id: "caveat", name: "Caveat", category: "Display/Creative", stack: '"Caveat", cursive' },
  { id: "shadows-into-light", name: "Shadows Into Light", category: "Display/Creative", stack: '"Shadows Into Light", cursive' },
  { id: "patrick-hand", name: "Patrick Hand", category: "Display/Creative", stack: '"Patrick Hand", cursive' },
  { id: "comfortaa", name: "Comfortaa", category: "Display/Creative", stack: '"Comfortaa", sans-serif' },
  { id: "dancing-script", name: "Dancing Script", category: "Display/Creative", stack: '"Dancing Script", cursive' },
  { id: "pacifico", name: "Pacifico", category: "Display/Creative", stack: '"Pacifico", cursive' },
  { id: "oswald", name: "Oswald", category: "Display/Creative", stack: '"Oswald", sans-serif' },
  { id: "lobster", name: "Lobster", category: "Display/Creative", stack: '"Lobster", cursive' },
];

/** Popular system/web-safe fonts for local fallback and universal compatibility. */
export const SYSTEM_FONTS: GoogleFontOption[] = [
  { id: "system-ui", name: "System UI (Native)", category: "Sans-Serif", stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: "arial", name: "Arial", category: "Sans-Serif", stack: 'Arial, Helvetica, sans-serif' },
  { id: "helvetica", name: "Helvetica", category: "Sans-Serif", stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: "calibri", name: "Calibri", category: "Sans-Serif", stack: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif' },
  { id: "segoe-ui", name: "Segoe UI", category: "Sans-Serif", stack: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  { id: "verdana", name: "Verdana", category: "Sans-Serif", stack: 'Verdana, Geneva, sans-serif' },
  { id: "tahoma", name: "Tahoma", category: "Sans-Serif", stack: 'Tahoma, Verdana, Segoe, sans-serif' },
  { id: "trebuchet-ms", name: "Trebuchet MS", category: "Sans-Serif", stack: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif' },
  { id: "georgia", name: "Georgia", category: "Serif", stack: 'Georgia, "Nirmala UI", "Times New Roman", serif' },
  { id: "times-new-roman", name: "Times New Roman", category: "Serif", stack: '"Times New Roman", Times, Baskerville, Georgia, serif' },
  { id: "garamond", name: "Garamond", category: "Serif", stack: 'Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", "Times New Roman", serif' },
  { id: "palatino", name: "Palatino", category: "Serif", stack: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { id: "charter", name: "Charter", category: "Serif", stack: '"Charter", "Bitstream Charter", Georgia, serif' },
  { id: "baskerville", name: "Baskerville", category: "Serif", stack: '"Baskerville", "Baskerville Old Face", Georgia, serif' },
  { id: "courier-new", name: "Courier New", category: "Monospace", stack: '"Courier New", Courier, monospace' },
  { id: "consolas", name: "Consolas", category: "Monospace", stack: 'Consolas, Monaco, "Andale Mono", monospace' },
  { id: "monaco", name: "Monaco", category: "Monospace", stack: 'Monaco, Consolas, "Lucida Console", monospace' },
];

const SYSTEM_FONT_NAMES = new Set([
  "Arial", "Helvetica", "Calibri", "Segoe UI", "Verdana", "Tahoma",
  "Trebuchet MS", "Georgia", "Times New Roman", "Garamond", "Palatino",
  "Charter", "Baskerville", "Courier New", "Consolas", "Monaco", "System UI (Native)"
]);

const SINGLE_WEIGHT_FONTS = new Set([
  "Pacifico", "Lobster", "Shadows Into Light", "Patrick Hand", "Marcellus"
]);

/** Returns Google Fonts stylesheet URL for a given font name. */
export function getGoogleFontUrl(fontName: string): string {
  const cleanName = fontName.trim().replace(/^["']|["']$/g, "");
  const encoded = cleanName.replace(/\s+/g, "+");
  if (SINGLE_WEIGHT_FONTS.has(cleanName)) {
    return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
}

/** The `<link>` id a loaded font uses, so a font is never requested twice (the pre-paint script in app/layout.tsx uses it too). */
export function googleFontLinkId(fontName: string): string {
  return `gf-link-${fontName.trim().replace(/^["']|["']$/g, "").toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

/** The stylesheet a font needs, or null for a device font that is never downloaded. */
export function googleFontHref(fontName: string): string | null {
  const cleanName = fontName.trim().replace(/^["']|["']$/g, "");
  return !cleanName || SYSTEM_FONT_NAMES.has(cleanName) ? null : getGoogleFontUrl(cleanName);
}

/** Dynamically injects Google Font link into document head so custom fonts render in real time. */
export function loadGoogleFont(fontName: string): void {
  if (typeof document === "undefined" || !fontName) return;
  const cleanName = fontName.trim().replace(/^["']|["']$/g, "");
  if (SYSTEM_FONT_NAMES.has(cleanName)) return;

  const fontId = googleFontLinkId(cleanName);
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = getGoogleFontUrl(cleanName);
  link.onerror = () => {
    /* Ignore font network errors gracefully when offline or ad-blocked */
  };
  document.head.appendChild(link);
}
