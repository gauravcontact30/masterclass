import { z } from "zod";
import { SUGGESTION_CATEGORIES, SUGGESTION_PRIORITIES, SUGGESTION_STATUSES } from "./suggestions";

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
/** Bulk actions from the admin inbox: change status and/or priority, or delete, for up to 100 suggestions. */
export const suggestionBulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), ids: z.array(z.uuid()).min(1).max(100), status: z.enum(SUGGESTION_STATUSES).optional(), priority: z.enum(SUGGESTION_PRIORITIES).optional() }).strict()
    .refine(value => value.status || value.priority, { message: "status or priority is required" }),
  z.object({ action: z.literal("delete"), ids: z.array(z.uuid()).min(1).max(100) }).strict(),
]);
