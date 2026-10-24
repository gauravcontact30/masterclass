/*
 * Audio lectures: the voices a learner can pick and how text is cut into parts. Voices are Google's Gemini TTS
 * voices through Vercel AI Gateway, ten female and ten male, chosen for warm, smooth and clear delivery; they read
 * English and Hindi. Client-safe (the landing page's Listen buttons import it): no zod, no server code.
 */
export type VoiceGender = "female" | "male";
export type Voice = { id: string; gender: VoiceGender; style: [en: string, hi: string] };

export const VOICES: Voice[] = [
  { id: "Sulafat", gender: "female", style: ["Warm", "आत्मीय"] },
  { id: "Achernar", gender: "female", style: ["Soft", "कोमल"] },
  { id: "Vindemiatrix", gender: "female", style: ["Gentle", "सौम्य"] },
  { id: "Despina", gender: "female", style: ["Smooth", "सहज"] },
  { id: "Aoede", gender: "female", style: ["Breezy", "हल्की-फुल्की"] },
  { id: "Callirrhoe", gender: "female", style: ["Easy-going", "सरल"] },
  { id: "Erinome", gender: "female", style: ["Clear", "स्पष्ट"] },
  { id: "Kore", gender: "female", style: ["Confident", "आत्मविश्वासी"] },
  { id: "Leda", gender: "female", style: ["Youthful", "युवा"] },
  { id: "Zephyr", gender: "female", style: ["Bright", "उजली"] },
  { id: "Charon", gender: "male", style: ["Informative", "जानकारीपूर्ण"] },
  { id: "Algieba", gender: "male", style: ["Smooth", "सहज"] },
  { id: "Sadaltager", gender: "male", style: ["Knowledgeable", "ज्ञानी"] },
  { id: "Iapetus", gender: "male", style: ["Clear", "स्पष्ट"] },
  { id: "Achird", gender: "male", style: ["Friendly", "मित्रवत"] },
  { id: "Umbriel", gender: "male", style: ["Easy-going", "सरल"] },
  { id: "Schedar", gender: "male", style: ["Even", "संतुलित"] },
  { id: "Rasalgethi", gender: "male", style: ["Thoughtful", "विचारशील"] },
  { id: "Orus", gender: "male", style: ["Firm", "दृढ़"] },
  { id: "Puck", gender: "male", style: ["Upbeat", "उत्साही"] },
];
export const DEFAULT_VOICE = "Sulafat";
/** The voice each gender switch starts on: the warmest female and the smoothest male narrator. */
export const DEFAULT_VOICES: Record<VoiceGender, string> = { female: "Sulafat", male: "Algieba" };
export const genderOf = (id: string): VoiceGender => VOICES.find(voice => voice.id === id)?.gender ?? "female";
export const isVoice = (id: unknown): id is string => typeof id === "string" && VOICES.some(voice => voice.id === id);
export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Longest text one request may voice; a lecture is read as several parts of at most this. */
export const MAX_PART = 900;

/** Plain text from a card's HTML or markdown-ish content, with whitespace collapsed. */
export function speakable(text: string) {
  return text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<\/(p|div|li|h[1-6]|tr|br)>|<br\s*\/?>/gi, ". ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/[*_`#>|]+/g, " ").replace(/\s*\.\s*(\.\s*)+/g, ". ").replace(/\s+/g, " ").trim();
}

/**
 * Cuts a lecture into parts at sentence ends: a short first part so playback starts quickly, then parts up to
 * MAX_PART characters. A sentence longer than a part is cut at a word boundary.
 */
export function lectureParts(text: string, first = 260): string[] {
  const sentences = speakable(text).match(/[^.!?।]+[.!?।]+["')\]]*\s*|[^.!?।]+$/g)?.map(s => s.trim()).filter(Boolean) ?? [];
  const parts: string[] = [];
  let current = "";
  const limit = () => parts.length ? MAX_PART : first;
  for (let sentence of sentences) {
    while (sentence.length > MAX_PART) {
      const cut = sentence.lastIndexOf(" ", MAX_PART) > 0 ? sentence.lastIndexOf(" ", MAX_PART) : MAX_PART;
      if (current) { parts.push(current); current = ""; }
      parts.push(sentence.slice(0, cut).trim()); sentence = sentence.slice(cut).trim();
    }
    if (current && (current + " " + sentence).length > limit()) { parts.push(current); current = sentence; }
    else current = current ? `${current} ${sentence}` : sentence;
  }
  if (current) parts.push(current);
  return parts;
}
