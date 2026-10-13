/**
 * Where a vocabulary word's picture lives.
 *
 * Pictures are generated once, offline, by `scripts/generate-vocabulary-images.ts`
 * and uploaded to a public storage bucket under the word's slug. Nothing in the
 * client knows which words have one — shipping a list of ~2,000 slugs to every
 * reader would cost more than the occasional miss — so the card asks for the
 * picture and falls back to the word's icon when the request fails.
 *
 * Until `NEXT_PUBLIC_VOCABULARY_IMAGE_BASE` is set no picture is requested at
 * all, which keeps local development and tests off the network.
 */

/** The bucket the generator writes to; public, so the URL needs no signing. */
export const VOCABULARY_IMAGE_BUCKET = "vocabulary-images";

/** "Shot in the arm" → "shot-in-the-arm"; the same word always maps to the same file. */
export function vocabularyImageSlug(word: string): string {
  return word.trim().toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function vocabularyImageUrl(word: string, base = process.env.NEXT_PUBLIC_VOCABULARY_IMAGE_BASE): string | null {
  const slug = vocabularyImageSlug(word);
  if (!base || !slug) return null;
  return `${base.replace(/\/+$/, "")}/${slug}.webp`;
}

/**
 * What the generator asks the image model for: the scene Claude designed for the
 * word, in one consistent photographic style. The card prints the word, the
 * definition and the sentence itself, so the picture must carry no lettering.
 */
export function vocabularyScenePrompt({ word, scene }: { word: string; scene: string }) {
  return [
    `Photorealistic cinematic still for a vocabulary flashcard teaching the English word "${word}".`,
    scene,
    "Dramatic natural lighting, shallow depth of field, rich colour, vertical composition with the key action in the upper two-thirds of the frame.",
    "Absolutely no text, letters, words, numbers, captions, signs, logos or watermarks anywhere in the image.",
  ].join("\n");
}
