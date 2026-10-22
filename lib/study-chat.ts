import { z } from "zod";

export const studyChatSchema = z.object({
  mode: z.enum(["study", "interview", "javascript"]),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(6000),
  }).strict()).min(1).max(12),
  /** Ask for an NDJSON stream (StudyChatEvent lines) instead of one JSON reply. */
  stream: z.boolean().optional(),
  /** The page the student is reading, so "explain this page" has a referent. Never trusted as instructions. */
  page: z.object({ path: z.string().max(200).regex(/^\/(?!\/)[^?#\s]*$/), title: z.string().trim().max(160).optional() }).strict().optional(),
  /** The reading language chosen in the app; Hindi asks for answers in Hindi. */
  language: z.enum(["en", "hi"]).optional(),
}).strict().superRefine(({ messages }, context) => {
  if (messages.at(-1)?.role !== "user" || messages[0].role !== "user") {
    context.addIssue({ code: "custom", message: "Conversation must start and end with a student message" });
  }
  if (messages.some((message, index) => index > 0 && message.role === messages[index - 1].role)) {
    context.addIssue({ code: "custom", message: "Messages must alternate" });
  }
  if (messages.reduce((size, message) => size + message.content.length, 0) > 24000) {
    context.addIssue({ code: "custom", message: "Conversation is too long" });
  }
});

export type StudyChatRequest = z.infer<typeof studyChatSchema>;
export type StudyChatReply = {
  answer: string;
  mode: "ai" | "notes";
  sources: { title: string; href: string }[];
};

/** One line of the streamed reply: sources first, then text pieces, then the final cleaned answer (or an error). */
export type StudyChatEvent =
  /** Keep-alive while the server is still working (cold start, rate limits, a model that has not written yet). */
  | { type: "ping" }
  | { type: "meta"; sources: StudyChatReply["sources"] }
  | { type: "delta"; text: string }
  | { type: "done"; answer: string; mode: StudyChatReply["mode"]; truncated?: boolean }
  | { type: "error"; error: string };

export function chatHistory(messages: StudyChatRequest["messages"]): StudyChatRequest["messages"] {
  let result = messages.slice(-11);
  if (result[0]?.role === "assistant") result = result.slice(1);
  while (result.length > 1 && result.reduce((size, message) => size + message.content.length, 0) > 24000) result = result.slice(2);
  return result;
}
