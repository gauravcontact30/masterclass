import { z } from "zod";

/*
 * The Super Admin's AI briefing: aggregate counts for a window go in, a short summary and up to five prioritised
 * actions come out. Only counts reach the model, never personal data. When no model is configured, or its reply is
 * unusable, ruleBriefing() gives the same shape from fixed thresholds, labelled as such.
 */
export type BriefingMetrics = {
  days: number;
  requests: number; serverErrors: number; blocked: number; rateLimited: number; crossSite: number; adminProbes: number;
  aiCalls: number; aiFailures: number; exports: number;
  /** `visitors` counts first visits from new browsers in the window, not every returning visitor. */
  pageViews: number; visitors: number; newUsers: number; activeSubscriptions: number;
};
export const AREAS = ["security", "reliability", "growth", "revenue", "ai", "content"] as const;
export const briefingSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  actions: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    area: z.enum(AREAS),
    title: z.string().trim().min(1).max(120),
    detail: z.string().trim().min(1).max(400),
  })).max(5),
});
export type Briefing = z.infer<typeof briefingSchema> & { source: "ai" | "rules"; model?: string; generatedAt: string; metrics: BriefingMetrics };

const pct = (part: number, whole: number) => whole ? Math.round((part / whole) * 1000) / 10 : 0;

/** A briefing from fixed thresholds: used without a model, or when the model's reply cannot be used. */
export function ruleBriefing(m: BriefingMetrics): Omit<Briefing, "source" | "generatedAt" | "metrics"> {
  const actions: Briefing["actions"] = [];
  const errorRate = pct(m.serverErrors, m.requests);
  if (m.serverErrors > 0 && errorRate >= 1) actions.push({ priority: errorRate >= 5 ? "high" : "medium", area: "reliability", title: `Investigate ${m.serverErrors} server errors (${errorRate}% of requests)`, detail: "Open Health and Logs, group the 5xx responses by path, and fix the busiest failing route first." });
  if (m.adminProbes >= 5) actions.push({ priority: "high", area: "security", title: `${m.adminProbes} refused calls to the admin API`, detail: "Check Security → Top sources. Repeated probes from one address are worth blocking in the firewall." });
  if (m.rateLimited >= 20) actions.push({ priority: "medium", area: "security", title: `${m.rateLimited} requests hit rate limits`, detail: "Look for one source hammering an endpoint (scraping or a broken client) in the rate-limit log." });
  if (m.aiFailures > 0 && pct(m.aiFailures, m.aiCalls) >= 5) actions.push({ priority: "medium", area: "ai", title: `${m.aiFailures} AI calls failed or fell back (${pct(m.aiFailures, m.aiCalls)}%)`, detail: "Review AI analytics for the failing provider; check its key, credit balance and rate limits." });
  if (m.visitors > 0 && m.newUsers === 0) actions.push({ priority: "medium", area: "growth", title: `${m.visitors} visitors but no new sign-ups`, detail: "Check the sign-up flow end to end, including the confirmation email, and the landing page's calls to action." });
  else if (m.visitors > 0) actions.push({ priority: "low", area: "growth", title: `Sign-up rate ${pct(m.newUsers, m.visitors)}% (${m.newUsers} of ${m.visitors} visitors)`, detail: "Compare against last period; promote the best-converting campaign from User activities → Campaigns." });
  if (m.newUsers > 0 && m.activeSubscriptions === 0) actions.push({ priority: "low", area: "revenue", title: "No active paid memberships yet", detail: "Consider a trial-ending reminder announcement and check that checkout works with a small test payment." });
  const summary = actions.length
    ? `Last ${m.days} day${m.days === 1 ? "" : "s"}: ${m.pageViews} page views from ${m.visitors} visitors, ${m.newUsers} new users, ${m.requests} API requests with ${m.serverErrors} server errors and ${m.blocked} blocked. ${actions.filter(a => a.priority === "high").length || "No"} high-priority item${actions.filter(a => a.priority === "high").length === 1 ? "" : "s"}.`
    : `Last ${m.days} day${m.days === 1 ? "" : "s"} look healthy: no thresholds were crossed.`;
  return { summary, actions: actions.slice(0, 5) };
}

/** Pulls the first JSON object out of a model reply (models sometimes wrap it in prose or a code fence). */
export function parseBriefing(text: string) {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { const parsed = briefingSchema.safeParse(JSON.parse(text.slice(start, end + 1))); return parsed.success ? parsed.data : null; } catch { return null; }
}
