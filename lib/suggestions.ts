import { z } from "zod";

export const SUGGESTION_STATUSES = ["new", "reviewing", "planned", "in_progress", "completed", "declined"] as const;
export const SUGGESTION_CATEGORIES = ["feature", "content", "bug", "accessibility", "other"] as const;
export const SUGGESTION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const suggestionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.union([z.email().max(254), z.literal("")]).default(""),
  category: z.enum(SUGGESTION_CATEGORIES),
  title: z.string().trim().min(5).max(140),
  body: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional(),
}).strict();
export const suggestionUpdateSchema = z.object({
  id: z.uuid(), version: z.number().int().positive(),
  status: z.enum(SUGGESTION_STATUSES), priority: z.enum(SUGGESTION_PRIORITIES),
  reply: z.string().trim().max(4000).default(""),
}).strict();
export type Suggestion = {
  id: string; name: string; email?: string | null; category: string; title: string; body: string;
  status: string; priority?: string; version: number; created_at: string; updated_at: string;
};
export type SuggestionUpdate = { id: string; status: string; reply: string | null; created_at: string };
export const suggestionLabel = (value: string) => value.replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
export function suggestionError(code: string) {
  return ({ migration_required: "Suggestion Box is not ready yet. Please try again later.", rate_limited: "Too many requests. Please wait a few minutes and try again.", invalid_request: "Check the fields and their length limits, then try again.", not_found: "No suggestion matches that private tracking code.", conflict: "This suggestion changed while you were editing. Reload it before saving." } as Record<string, string>)[code] ?? "Could not complete this request. Please try again.";
}
