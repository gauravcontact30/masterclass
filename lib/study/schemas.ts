import { z } from "zod";

/*
 * Request and data validation for study content. Kept apart from ./types.ts, which the dashboard bundles on the
 * client through the course catalogue, so zod loads only where data is validated.
 */
export const appearanceSchema = z.object({
  exam: z.string().min(1), year: z.number().int().min(1950).max(2100), paper: z.string().min(1),
  questionNumber: z.string().min(1), sourceUrl: z.string().url(),
  // A question occurrence needs a location, not just an exam's homepage.
  sourcePage: z.number().int().positive(), verified: z.literal(true),
});
export type Appearance = z.infer<typeof appearanceSchema>;

export const attemptSchema = z.object({ paperId: z.string().max(120), language: z.enum(["en", "hi"]), answers: z.record(z.string().max(120), z.number().int().min(0).max(9)).refine(answers => Object.keys(answers).length <= 200) }).strict();
