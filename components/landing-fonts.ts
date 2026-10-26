import { Anek_Devanagari, Anek_Latin } from "next/font/google";

/**
 * The landing page's one family, Anek, in two cuts of the same design: Anek Latin for English and Anek Devanagari
 * (Latin and Devanagari together) for Hindi, so English and Hindi share one voice. Its width axis (75 to 125) carries
 * the display type; body text stays at the default width. Both set --font-anek; pick one with `landingFont`.
 *
 * Why two: Anek Devanagari's Devanagari file is ~700 KB, and its unicode-range also covers ₹ (U+20B9), so English
 * pages downloaded it for every price, Hindi gloss and "हिन्दी" toggle. English now never references that face.
 */
/** Not preloaded since Inter became the site-wide font (app/layout.tsx): Anek now only backs up glyphs Inter lacks. */
export const anekLatin = Anek_Latin({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-anek", preload: false });
/** Not preloaded: it is only needed once a reader switches to Hindi. */
export const anekDevanagari = Anek_Devanagari({ subsets: ["devanagari", "latin"], axes: ["wdth"], display: "swap", variable: "--font-anek", preload: false });

/** The Anek cut for the reading language. */
export const landingFont = (hindi: boolean) => hindi ? anekDevanagari : anekLatin;
