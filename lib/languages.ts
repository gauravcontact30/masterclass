/** The site's language codes, apart from lib/domain.ts so client code that only needs them does not ship zod. */
export const LANGUAGES = ["en", "hi", "es", "ja", "de", "fr", "zh"] as const;
export type Language = (typeof LANGUAGES)[number];
