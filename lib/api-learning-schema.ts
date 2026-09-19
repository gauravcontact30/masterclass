import { z } from "zod";
export const learningFileSchema = z.object({
  path: z.string().min(1).max(120).regex(/^\/?[a-zA-Z0-9_@.\-/]+$/).refine(path => !path.split("/").includes("..")),
  code: z.string().max(18000),
});
export const learningProjectSchema = z.object({
  title: z.string().max(140),
  template: z.enum(["react-ts", "vanilla-ts", "angular", "vue", "node", "nextjs", "python", "local"]),
  entry: z.string().max(120),
  files: z.array(learningFileSchema).min(2).max(14),
  dependencies: z.record(z.string().max(100), z.string().max(60)).default({}),
  instructions: z.array(z.string().max(600)).min(1).max(8),
}).refine(project => project.files.some(file => file.path === project.entry), "Entry file must be present")
  .refine(project => new Set(project.files.map(file => file.path.replace(/^\//,""))).size === project.files.length, "File paths must be unique");
export const subjectiveQuestionSchema = z.object({ question: z.string().min(5).max(600), answer: z.string().min(10).max(2200), followUp: z.string().max(600).default("") });
export const objectiveQuestionSchema = z.object({ question: z.string().min(5).max(600), options: z.array(z.string().min(1).max(400)).length(4), answer: z.number().int().min(0).max(3), explanation: z.string().min(10).max(1600) });
export type LearningProject = z.infer<typeof learningProjectSchema>;
export type SubjectiveQuestion = z.infer<typeof subjectiveQuestionSchema>;
export type ObjectiveQuestion = z.infer<typeof objectiveQuestionSchema>;
