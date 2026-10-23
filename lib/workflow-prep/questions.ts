import type { QuestionSet } from "@/lib/interview-questions";

/**
 * The longer interview list behind each Workflow blueprint. The base three-and-three in agentic.ts and
 * system-design.ts ship with the panel; the rest of each blueprint's questions live in ./questions/<id>.ts and
 * load as their own chunk when that blueprint's slide comes near, so opening the section stays light.
 */
const MORE: Record<string, () => Promise<{ default: QuestionSet }>> = {
  "food-delivery": () => import("./questions/food-delivery"),
  "url-shortener": () => import("./questions/url-shortener"),
  "rate-limiter": () => import("./questions/rate-limiter"),
  "cache-aside": () => import("./questions/cache-aside"),
  "event-driven": () => import("./questions/event-driven"),
  "scalable-web": () => import("./questions/scalable-web"),
  sharding: () => import("./questions/sharding"),
  payments: () => import("./questions/payments"),
  notifications: () => import("./questions/notifications"),
  "news-feed": () => import("./questions/news-feed"),
  chat: () => import("./questions/chat"),
  video: () => import("./questions/video"),
  autocomplete: () => import("./questions/autocomplete"),
  "job-scheduler": () => import("./questions/job-scheduler"),
  "ride-matching": () => import("./questions/ride-matching"),
  "langchain-rag": () => import("./questions/langchain-rag"),
  "langchain-agent": () => import("./questions/langchain-agent"),
  "langgraph-hitl": () => import("./questions/langgraph-hitl"),
  "langgraph-supervisor": () => import("./questions/langgraph-supervisor"),
  langflow: () => import("./questions/langflow"),
  langsmith: () => import("./questions/langsmith"),
  "ecommerce-support": () => import("./questions/ecommerce-support"),
  "healthcare-prior-auth": () => import("./questions/healthcare-prior-auth"),
  "hospital-triage": () => import("./questions/hospital-triage"),
  "bank-fraud": () => import("./questions/bank-fraud"),
  "insurance-claims": () => import("./questions/insurance-claims"),
  "corporate-helpdesk": () => import("./questions/corporate-helpdesk"),
  "sre-incident": () => import("./questions/sre-incident"),
  "legal-contracts": () => import("./questions/legal-contracts"),
  "supply-chain": () => import("./questions/supply-chain"),
  "coding-agent-evals": () => import("./questions/coding-agent-evals"),
  "invoice-extraction": () => import("./questions/invoice-extraction"),
  "sql-analytics": () => import("./questions/sql-analytics"),
  "lead-qualifier": () => import("./questions/lead-qualifier"),
  "review-triage": () => import("./questions/review-triage"),
  "prompt-experiments": () => import("./questions/prompt-experiments"),
  "feedback-loop": () => import("./questions/feedback-loop"),
};

export const hasMoreQuestions = (id: string) => id in MORE;

/** A blueprint's extra questions, or an empty set for one without a file. */
export async function loadMoreQuestions(id: string): Promise<QuestionSet> {
  const load = MORE[id];
  return load ? (await load()).default : { subjective: [], objective: [] };
}
