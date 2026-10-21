/*
 * The Super Admin pages that carry an AI copilot: what each page is for (its header description) and the questions
 * worth asking its data. Plain data with no server or validation imports, so the dashboard can read it on the client.
 */
export const COPILOT_PAGES = ["analytics", "ai", "insights", "support", "moderation", "announcements", "billing", "content", "queue", "infra", "health", "logs", "security"] as const;
export type CopilotPage = (typeof COPILOT_PAGES)[number];
export const isCopilotPage = (value: string): value is CopilotPage => (COPILOT_PAGES as readonly string[]).includes(value);

export type CopilotPageMeta = {
  /** Page header description: what the page lets the admin do. */
  description: string;
  /** Heading of the record list that needs the admin's attention on this page. */
  focus: string;
  /** One-click questions for "Ask about this page". */
  questions: string[];
};

export const COPILOT_META: Record<CopilotPage, CopilotPageMeta> = {
  analytics: {
    description: "How learners actually study: active learners, completion and drop-off per document, with an AI read of where learning stalls and what to fix first.",
    focus: "Documents where learners stall",
    questions: ["Which documents lose the most learners, and why might that be?", "Is learner activity growing compared with the previous period?", "What would raise the completion rate fastest?"],
  },
  ai: {
    description: "Every AI call by feature and provider: volume, failures, fallbacks, latency, tokens and cost, with AI-detected reliability and spend risks.",
    focus: "AI features needing attention",
    questions: ["Which AI feature is least reliable right now?", "Where is AI spend or token use concentrated?", "Should any feature switch provider or model?"],
  },
  insights: {
    description: "Acquisition and conversion: visitors, sessions, sign-ups and the channels behind them, compared with the previous period and explained by AI.",
    focus: "Acquisition channels",
    questions: ["Which channel brings visitors who sign up?", "Why did traffic change compared with the previous period?", "Where should I focus marketing effort this week?"],
  },
  support: {
    description: "Find learners who need help before they ask: failed generations, payment grace periods and open suggestions, with AI-suggested responses.",
    focus: "Learners who may need help",
    questions: ["What is the most common problem learners hit?", "Which failure codes should engineering fix first?", "Draft a helpful message for learners affected by failed generations."],
  },
  moderation: {
    description: "Review learner content reports with AI triage: severity for each open report, ageing and recurring problem pages, then resolve them below.",
    focus: "Open content reports (oldest first)",
    questions: ["Which open reports should I handle first?", "Which pages are reported repeatedly?", "Are any reports likely spam or duplicates?"],
  },
  announcements: {
    description: "Tell every learner what changed. See live, scheduled and stale announcements, and let AI draft one from current platform activity.",
    focus: "All announcements",
    questions: ["Is there anything learners should be told about right now?", "Are any live announcements stale or out of date?", "Draft a maintenance notice for this weekend."],
  },
  billing: {
    description: "Revenue, payments and memberships from the Razorpay ledger: captured revenue, failures, refunds and renewals at risk, with AI churn and revenue insights.",
    focus: "Memberships at risk",
    questions: ["Why did revenue change compared with the previous period?", "Which memberships are at risk of churning?", "How can I reduce failed payments?"],
  },
  content: {
    description: "What changed and what was produced: generated document outcomes, the database audit trail and the most edited records, with AI-flagged anomalies.",
    focus: "Most changed records",
    questions: ["Were there any unusual data changes in this period?", "Why are document generations failing?", "Which content areas are edited most?"],
  },
  queue: {
    description: "The document generation pipeline: backlog, stuck and retried jobs, throughput and failure reasons, with an AI diagnosis of queue health.",
    focus: "Jobs needing attention",
    questions: ["Is the queue healthy right now?", "What is causing the generation failures?", "Are any jobs stuck, and what should I do about them?"],
  },
  infra: {
    description: "Runtime and traffic capacity: request volume, route latency and payload weight, alongside host resources, with AI capacity recommendations.",
    focus: "Heaviest routes",
    questions: ["Which routes are slowest and why might that be?", "Do we need more capacity for current traffic?", "Where can response size be reduced?"],
  },
  health: {
    description: "Availability and errors: error rates, latency against the previous period and failing routes, with an AI incident summary and probable causes.",
    focus: "Failing routes",
    questions: ["Is there an active incident?", "What changed in error rates compared with the previous period?", "Which failing route should I fix first?"],
  },
  logs: {
    description: "Application events grouped into error signatures, with new signatures since the previous period highlighted and explained by AI.",
    focus: "Error signatures",
    questions: ["Which errors are new in this period?", "Summarise the noisiest errors in plain language.", "Which errors are likely related?"],
  },
  security: {
    description: "Threats and access: refused and rate-limited requests, admin API probes, cross-site attempts and hot rate-limit keys, with an AI threat assessment.",
    focus: "Refused request sources",
    questions: ["Is anyone probing or attacking the app?", "Which sources should I block?", "Are rate limits set at the right levels?"],
  },
};
