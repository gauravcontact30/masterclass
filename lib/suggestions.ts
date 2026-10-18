// Zod-free on purpose: the landing navbar imports this module, and zod must stay out of the landing bundle.
// The request schemas live in lib/suggestions-schema.ts (server routes only).
export const SUGGESTION_STATUSES = ["new", "reviewing", "planned", "in_progress", "completed", "declined"] as const;
export const SUGGESTION_CATEGORIES = ["feature", "content", "bug", "accessibility", "other"] as const;
export const SUGGESTION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
/** Fields the admin search box can be narrowed to. "all" also searches replies. */
export const SUGGESTION_SCOPES = ["all", "title", "message", "contributor", "reply", "id"] as const;
export const SUGGESTION_SORTS = ["newest", "oldest", "updated", "priority"] as const;
export const SUGGESTION_PAGE_SIZE = 10;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];
export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];
export type SuggestionPriority = (typeof SUGGESTION_PRIORITIES)[number];
export type Suggestion = {
  id: string; name: string; email?: string | null; category: string; title: string; body: string;
  status: string; priority?: string; version: number; created_at: string; updated_at: string;
  reply_count?: number; last_reply_at?: string | null;
};
export type SuggestionUpdate = { id: string; status: string; reply: string | null; created_at: string };
export const suggestionLabel = (value: string) => value.replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
export function suggestionError(code: string) {
  return ({ migration_required: "Suggestion Box is not ready yet. Please try again later.", rate_limited: "Too many requests. Please wait a few minutes and try again.", invalid_request: "Check the fields and their length limits, then try again.", not_found: "No suggestion matches that private tracking code.", conflict: "This suggestion changed while you were editing. Reload it before saving." } as Record<string, string>)[code] ?? "Could not complete this request. Please try again.";
}
