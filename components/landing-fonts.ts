import { Anek_Devanagari } from "next/font/google";

/**
 * The landing page's one family: Anek covers Latin and Devanagari in the same
 * design, so English and Hindi share one voice. Its width axis (75 to 125)
 * carries the display type; body text stays at the default width.
 */
export const anek = Anek_Devanagari({
  // Only Latin is preloaded: the Devanagari file is ~700 KB and preloading it made every visitor download it before
  // the hero heading could paint (mobile LCP). It still loads on demand, through its unicode-range, when Hindi shows.
  subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-anek",
});
