import { Anek_Devanagari } from "next/font/google";

/**
 * The landing page's one family: Anek covers Latin and Devanagari in the same
 * design, so English and Hindi share one voice. Its width axis (75 to 125)
 * carries the display type; body text stays at the default width.
 */
export const anek = Anek_Devanagari({ subsets: ["latin", "devanagari"], axes: ["wdth"], display: "swap", variable: "--font-anek" });
