import { vocabularyImageSlug } from "./vocabulary-image";

/**
 * Where the pictures for the learning cards across the app live: Search topic
 * cards, the API reference, agentic workflows, Official Docs, Notes, Pro
 * lessons, step-by-step guides and Techy decks, and the course paths.
 *
 * Like the vocabulary and AWS pictures, they are generated offline
 * (`npm run images:<set>`, one script per set below) into one public
 * bucket, a folder per set, and the client does not know which subjects have
 * one: it asks, and the picture hides itself when the request fails. Nothing is
 * requested until NEXT_PUBLIC_LEARNING_IMAGE_BASE is set.
 */
export const LEARNING_IMAGE_BUCKET = "learning-images";

export type LearningImageSet = "topics" | "api" | "workflow" | "docs" | "notes" | "lessons" | "guides" | "courses";

/** FNV-1a, base 36: a short, stable tag that tells apart names that slug alike. */
function tag(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  return (hash >>> 0).toString(36).slice(0, 5);
}

/**
 * "Search · Python handbook", "List comprehensions" → "python-handbook--list-comprehensions".
 *
 * Each part is slugged on its own and the parts joined with "--", so the same
 * topic name in two handbooks gets two pictures. A part that slugging changes
 * at all carries a short tag of its exact spelling, so names that slug alike
 * ("Map" and "map", "str" and "__str__" in one API package) never share a file.
 */
export function learningImageSlug(...parts: string[]): string {
  const slugs = parts.map(part => {
    const slug = vocabularyImageSlug(part);
    return slug && slug !== part ? `${slug}-${tag(part)}` : slug;
  });
  return slugs.every(Boolean) ? slugs.join("--") : "";
}

export function learningImageUrl(set: LearningImageSet, parts: string[], base = process.env.NEXT_PUBLIC_LEARNING_IMAGE_BASE): string | null {
  const slug = learningImageSlug(...parts);
  if (!base || !slug) return null;
  return `${base.replace(/\/+$/, "")}/${set}/${slug}.webp`;
}

/** What the generator asks the image model for, around the scene Claude designed. */
export function learningScenePrompt({ subject, scene, field = "software-engineering" }: { subject: string; scene: string; field?: string }) {
  return [
    `A polished, modern 3D isometric illustration for a ${field} course card about ${subject}, showing how it works.`,
    scene,
    "Soft studio lighting, clean pastel background with gentle gradients, crisp detailed objects, landscape composition with the key action centred.",
    "Absolutely no text, letters, words, numbers, code, logos, brand marks, captions or watermarks anywhere in the image.",
  ].join("\n");
}
