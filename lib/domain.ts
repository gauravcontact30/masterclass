import { z } from "zod";

export const requestSchema = z.object({
  technologyId: z.string().min(1).max(80),
  topicId: z.string().min(1).max(80),
  format: z.enum(["pdf", "pptx"]),
  language: z.enum(["en", "hi"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  theme: z.enum(["minimal", "corporate", "cyberpunk"]),
}).strict();
export type GenerationRequest = z.infer<typeof requestSchema>;
export type Language = "en" | "hi";
export type Tier = "free" | "monthly" | "yearly";
export type Topic = { id: string; technology_id: string; title: string; title_hi: string; full_track: boolean; version: number; references: string[] };
export type Technology = { id: string; title: string; title_hi: string; category: string };
export const lessonSchema = z.object({
  title: z.string().min(1).max(100),
  explanation: z.string().min(40).max(1800),
  example: z.string().min(10).max(1000),
  code: z.string().max(1800).default(""),
  exercise: z.string().min(10).max(600),
  checkpoint: z.string().min(10).max(500),
  mistake: z.string().min(10).max(600),
});
export const curriculumSchema = z.object({
  title: z.string().min(1).max(120),
  objectives: z.array(z.string().max(250)).min(2).max(6),
  prerequisites: z.array(z.string().max(250)).max(6),
  minutes: z.number().int().min(10).max(3000),
  lessons: z.array(lessonSchema).min(3).max(24),
  project: z.string().min(20).max(1200),
  summary: z.string().min(20).max(1000),
  glossary: z.array(z.object({ term: z.string().max(80), definition: z.string().max(300) })).min(2).max(12),
});
export type Curriculum = z.infer<typeof curriculumSchema>;
export type DocumentRecord = {
  id: string; user_id: string; title: string; request: GenerationRequest;
  status: "queued" | "generating" | "ready" | "failed";
  created_at: string; error_code: string | null; curriculum: Curriculum | null;
  page_titles: string[]; storage_path: string | null; preview_paths: string[];
};
export type Progress = { document_id: string; page: number; completed: boolean; bookmarks: number[]; notes: string; updated_at?: string };
export const progressSchema = z.object({ page: z.number().int().min(1).max(500), completed: z.boolean(), bookmarks: z.array(z.number().int().min(1).max(500)).max(500), notes: z.string().max(20000) }).strict();

export function documentKey(input: GenerationRequest, version: number) {
  return [input.technologyId, input.topicId, input.format, input.language, input.level, input.theme, version, "renderer-v1"].join(":");
}
export function monthKey(date = new Date()) { return date.toISOString().slice(0, 7) + "-01"; }
export function entitlementTier(subscription: { tier: Tier; status: string; current_period_end: string | null; grace_until?: string | null } | null, now = Date.now()): Tier {
  if (!subscription) return "free";
  if (["active", "cancelled", "completed"].includes(subscription.status) && Date.parse(subscription.current_period_end ?? "") > now) return subscription.tier;
  if (subscription.status === "pending" && Date.parse(subscription.grace_until ?? "") > now) return subscription.tier;
  return "free";
}
