import { vocabularyImageSlug } from "./vocabulary-image";

/**
 * Where an AWS service card's picture lives.
 *
 * AWS's own service icons are trademarked artwork (see components/aws-service-icon.tsx),
 * so each card gets an original illustration of what the service does instead,
 * generated offline by `npm run images:aws` into this public bucket under the
 * service's slug. As with the vocabulary pictures, the client does not know which
 * services have one: the card asks, and keeps its icon when the request fails.
 * Nothing is requested until NEXT_PUBLIC_AWS_SERVICE_IMAGE_BASE is set.
 */
export const AWS_SERVICE_IMAGE_BUCKET = "aws-service-images";

/** "Amazon S3" → "amazon-s3". */
export const awsServiceImageSlug = vocabularyImageSlug;

export function awsServiceImageUrl(name: string, base = process.env.NEXT_PUBLIC_AWS_SERVICE_IMAGE_BASE): string | null {
  const slug = awsServiceImageSlug(name);
  if (!base || !slug) return null;
  return `${base.replace(/\/+$/, "")}/${slug}.webp`;
}

/** What the generator asks the image model for, around the scene Claude designed. */
export function awsServiceScenePrompt({ name, scene }: { name: string; scene: string }) {
  return [
    `A polished, modern 3D isometric illustration for a cloud-computing course card about ${name}, showing what the service does.`,
    scene,
    "Soft studio lighting, clean pastel background with gentle gradients, crisp detailed objects, landscape composition with the key action centred.",
    "Absolutely no text, letters, words, numbers, logos, brand marks, AWS or Amazon branding, captions or watermarks anywhere in the image.",
  ].join("\n");
}
