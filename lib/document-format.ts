/*
 * Constants and helpers shared by client components, kept apart from ./domain.ts so its zod schemas stay on the
 * server. ./domain.ts re-exports them.
 */
export const DOCUMENT_FORMAT = "notes" as const;
/**
 * The label an option is referred to by, everywhere an objective question is
 * shown: the notes reader, the study test runner, the landing-page sample and
 * the plain-text export all number options A, B, C, D from the same helper, so
 * an answer written as "B" means the same option in every surface.
 */
export const optionLetter = (index: number) => String.fromCharCode(65 + index);
/** An option rendered with its label, e.g. `B. Check the learner's access on the server`. */
export const labelledOption = (index: number, option: string) => `${optionLetter(index)}. ${option}`;
