import { z } from "zod";

export const studyChatSchema = z.object({
  mode: z.enum(["study", "interview", "javascript"]),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(6000),
  }).strict()).min(1).max(12),
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

export function chatHistory(messages: StudyChatRequest["messages"]): StudyChatRequest["messages"] {
  let result = messages.slice(-11);
  if (result[0]?.role === "assistant") result = result.slice(1);
  while (result.length > 1 && result.reduce((size, message) => size + message.content.length, 0) > 24000) result = result.slice(2);
  return result;
}
