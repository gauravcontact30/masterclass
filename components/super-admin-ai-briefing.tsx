"use client";
import { useState } from "react";
import { Bot, CreditCard, GraduationCap, RefreshCw, ShieldAlert, Sparkles, TrendingUp, Wrench, type LucideIcon } from "lucide-react";
import type { Briefing } from "@/lib/admin-briefing";
import styles from "./super-admin-ai-briefing.module.css";

const AREA_ICON: Record<string, LucideIcon> = { security: ShieldAlert, reliability: Wrench, growth: TrendingUp, revenue: CreditCard, ai: Bot, content: GraduationCap };
const KEY = (days: number) => `mc:admin-briefing:${days}`;
const ERRORS: Record<string, string> = { rate_limited: "Briefing limit reached (12 an hour). Try again later.", forbidden: "Only a Super Admin can generate a briefing." };

function cached(days: number): Briefing | null { try { return JSON.parse(sessionStorage.getItem(KEY(days)) ?? "null"); } catch { return null; } }

/**
 * The Overview's AI briefing: on request, the window's counts are read by the model and turned into a short summary
 * and prioritised actions (or by fixed rules when no model is available, labelled as such). On demand, never on
 * page load, so opening the console costs nothing; the latest result is kept for this browser session.
 */
export function SuperAdminAiBriefing({ days }: Readonly<{ days: number }>) {
  const span = [1, 7, 30, 90].includes(days) ? days : 7;
  const [briefing, setBriefing] = useState<Briefing | null>(() => typeof window === "undefined" ? null : cached(span));
  const [shownFor, setShownFor] = useState(span);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (shownFor !== span) { setShownFor(span); setBriefing(cached(span)); setError(""); }

  async function generate() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/super-admin/briefing?days=${span}`, { method: "POST", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      setBriefing(body);
      try { sessionStorage.setItem(KEY(span), JSON.stringify(body)); } catch { /* blocked */ }
    } catch (failure) {
      setError(ERRORS[failure instanceof Error ? failure.message : ""] ?? "The briefing could not be generated. Try again in a moment.");
    } finally { setBusy(false); }
  }

  const m = briefing?.metrics;
  return <section className={styles.card} aria-labelledby="ai-briefing-title" aria-busy={busy}>
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><Sparkles size={18} /></span>
      <div><h2 id="ai-briefing-title">AI briefing</h2><p>What needs your attention in the last {span} day{span === 1 ? "" : "s"}, read from traffic, security, AI and revenue counts.</p></div>
      <button type="button" onClick={() => void generate()} disabled={busy}><RefreshCw size={14} aria-hidden="true" className={busy ? styles.spin : undefined} />{busy ? "Analysing…" : briefing ? "Refresh briefing" : "Generate briefing"}</button>
    </header>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!briefing && !busy && !error && <p className={styles.empty}>Generate a briefing to get a plain-language summary and the next actions worth taking. Only aggregate counts are sent to the model, never personal data.</p>}
    {briefing && <>
      <p className={styles.summary}>{briefing.summary}</p>
      {briefing.actions.length > 0 && <ol className={styles.actions}>{briefing.actions.map(action => {
        const Icon = AREA_ICON[action.area] ?? Sparkles;
        return <li key={action.title} data-priority={action.priority}>
          <span className={styles.icon} aria-hidden="true"><Icon size={15} /></span>
          <div><div className={styles.actionHead}><b>{action.title}</b><span className={styles.priority}>{action.priority}</span><span className={styles.area}>{action.area}</span></div><p>{action.detail}</p></div>
        </li>;
      })}</ol>}
      {m && <dl className={styles.metrics}>
        {([["Page views", m.pageViews], ["New visitors", m.visitors], ["New users", m.newUsers], ["Active members", m.activeSubscriptions], ["API requests", m.requests], ["Server errors", m.serverErrors], ["Blocked", m.blocked], ["AI calls", m.aiCalls]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString("en-IN")}</dd></div>)}
      </dl>}
      <p className={styles.source}>{briefing.source === "ai" ? `Written by ${briefing.model ?? "the configured model"} from the counts above` : "No AI model available: generated from fixed thresholds"} · {new Date(briefing.generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST. Check figures before acting.</p>
    </>}
  </section>;
}
