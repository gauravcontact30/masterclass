import type { Language } from "@/lib/domain";

/**
 * Testimonials shown in the landing page "Loved by learners" carousel.
 *
 * READ BEFORE ADDING OR EDITING AN ENTRY
 * --------------------------------------
 * - Every entry must come from a real learner who used Master Class and
 *   gave written consent for their words, name (or initials), program and
 *   institution to appear on this public page. Keep that consent on record
 *   and remove the entry promptly if it is withdrawn.
 * - Never invent, "improve" or AI-generate a quote, and never attach a real
 *   college or university name to a quote that person did not give. Light
 *   copy-editing and translation are fine only if the learner approves them.
 * - `avatarUrl` must be a photo the person supplied themselves for this use.
 *   Do not use stock photos, scraped profile pictures or AI-generated faces.
 *   Put the file in `public/images/testimonials/` and reference it as
 *   "/images/testimonials/<file>.webp" (roughly 160x160, square). When
 *   `avatarUrl` is absent the carousel draws an initials avatar instead.
 * - `rating` is the learner's own score out of 5. Leave it out when they
 *   did not give one; the star row is then hidden.
 *
 * The first six entries were carried over unchanged from the landing page
 * copy that existed before this module. Confirm each one with the learner
 * (and add consent records) or replace it with a verified testimonial before
 * relying on it in public marketing.
 */

export type LocalizedText = Record<Language, string>;

export type Testimonial = {
  /** Stable id, used for React keys and the deterministic avatar colours. */
  id: string;
  /** The learner's own words, without surrounding quotation marks. */
  quote: LocalizedText;
  /** Name as the learner agreed to show it, e.g. first name + initial. */
  name: LocalizedText;
  /** Course or program, e.g. "B.Tech CSE". */
  program: LocalizedText;
  /** Institution, only if the learner explicitly agreed to show it. */
  institution?: LocalizedText;
  /** Photo supplied by the learner (see the rules above). */
  avatarUrl?: string;
  /** The learner's own rating out of 5. */
  rating?: 1 | 2 | 3 | 4 | 5;
};

export const testimonials: readonly Testimonial[] = [
  {
    id: "aisha-r",
    quote: {
      en: "I generated a full Data Structures guide the night before my exam — it actually made sense.",
      hi: "मैंने परीक्षा से पहली रात Data Structures की पूरी गाइड बनाई — यह वाकई समझ आई।",
    },
    name: { en: "Aisha R.", hi: "आयशा आर." },
    program: { en: "B.Tech CSE", hi: "बी.टेक सीएसई" },
    rating: 5,
  },
  {
    id: "rohan-v",
    quote: {
      en: "The interview questions at the end of every lesson got me through my placement round.",
      hi: "हर पाठ के अंत के इंटरव्यू प्रश्नों ने मेरे प्लेसमेंट राउंड में बहुत मदद की।",
    },
    name: { en: "Rohan V.", hi: "रोहन वी." },
    program: { en: "B.Sc IT", hi: "बी.एससी आईटी" },
    rating: 5,
  },
  {
    id: "priya-s",
    quote: {
      en: "Switching to Hindi for a friend who prefers it just worked, instantly.",
      hi: "हिन्दी पसंद करने वाले दोस्त के लिए भाषा बदलना तुरंत काम कर गया।",
    },
    name: { en: "Priya S.", hi: "प्रिया एस." },
    program: { en: "BCA", hi: "बीसीए" },
    rating: 5,
  },
  {
    id: "karan-m",
    quote: {
      en: "The code playground inside the reader is genuinely useful for practicing right there.",
      hi: "रीडर के अंदर का कोड प्लेग्राउंड वहीं अभ्यास करने के लिए सच में उपयोगी है।",
    },
    name: { en: "Karan M.", hi: "करण एम." },
    program: { en: "B.Tech ECE", hi: "बी.टेक ईसीई" },
    rating: 5,
  },
  {
    id: "meera-k",
    quote: {
      en: "Per-download pricing meant I didn’t need a subscription for one project.",
      hi: "प्रति-डाउनलोड मूल्य के कारण एक प्रोजेक्ट के लिए सदस्यता नहीं लेनी पड़ी।",
    },
    name: { en: "Meera K.", hi: "मीरा के." },
    program: { en: "MBA", hi: "एमबीए" },
    rating: 5,
  },
  {
    id: "dev-p",
    quote: {
      en: "The Playwright notes finally made locators and auto-waiting click for me.",
      hi: "Playwright नोट्स से आखिरकार locators और auto-waiting मुझे समझ आ गए।",
    },
    name: { en: "Dev P.", hi: "देव पी." },
    program: { en: "B.Des", hi: "बी.डेस" },
    rating: 5,
  },
];

/** Up to two initials from a display name, e.g. "Aisha R." -> "AR". */
export function testimonialInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(word => Array.from(word.replace(/[.,;:'"’()\-]/g, ""))[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Colour pairs for generated avatars, drawn from the landing page palette
 * (forest, sage, brass, slate, plum, clay) so every card stays on-brand.
 */
const avatarPalette: readonly (readonly [string, string])[] = [
  ["#1f4a3a", "#6f9a74"],
  ["#7a5a26", "#c9a45f"],
  ["#2f4f63", "#7fa2ad"],
  ["#4f3f63", "#9c88ad"],
  ["#6b4430", "#c08a64"],
  ["#2c5a52", "#86b3a3"],
];

/** Deterministic gradient for an initials avatar: same id, same colours. */
export function testimonialAvatarGradient(seed: string): string {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  const unsigned = hash >>> 0;
  const [from, to] = avatarPalette[unsigned % avatarPalette.length];
  const angle = 115 + ((unsigned >>> 8) % 6) * 15;
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}
