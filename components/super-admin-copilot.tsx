"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ClipboardCopy, Megaphone, MessageSquareText, RefreshCw, Send, Sparkles } from "lucide-react";
import { AdminTable, type AdminColumn } from "./super-admin-table";
import { COPILOT_META, type CopilotPage } from "@/lib/admin-pages";
import type { CopilotAnalysis, Finding, Kpi, PageSignals } from "@/lib/admin-copilot";
import styles from "./super-admin-copilot.module.css";

const ERRORS: Record<string, string> = {
  rate_limited: "AI limit reached (60 requests an hour). Try again later.",
  ai_unavailable: "No AI model is configured, so questions cannot be answered. Add a provider key to enable them.",
  forbidden: "Only a Super Admin can use the copilot.",
  invalid_request: "That question could not be sent. Use 3–500 characters.",
};
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const KEY = (page: string, days: number) => `mc:admin-copilot:${page}:${days}`;
const ist = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function cached(page: string, days: number): CopilotAnalysis | null { try { return JSON.parse(sessionStorage.getItem(KEY(page, days)) ?? "null"); } catch { return null; } }

function formatKpi(kpi: Kpi, value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  switch (kpi.format) {
    case "percent": return `${value}%`;
    case "ms": return value >= 10_000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value).toLocaleString("en-IN")} ms`;
    case "hours": return `${value} h`;
    case "minutes": return value >= 120 ? `${Math.round(value / 60)} h` : `${value} min`;
    case "money": return new Intl.NumberFormat("en-IN", { style: "currency", currency: kpi.currency ?? "INR", maximumFractionDigits: 2 }).format(value);
    case "bytes": return value >= 1 << 30 ? `${(value / (1 << 30)).toFixed(2)} GB` : value >= 1 << 20 ? `${(value / (1 << 20)).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;
    default: return value.toLocaleString("en-IN");
  }
}

/** The change against the previous window, coloured by whether that direction is good for this KPI. */
function Delta({ kpi }: { kpi: Kpi }) {
  if (kpi.previous === undefined || kpi.previous === null || kpi.value === null) return null;
  const diff = kpi.value - kpi.previous;
  if (!diff) return <span className={styles.delta}>No change</span>;
  const percent = kpi.format === "percent" ? `${diff > 0 ? "+" : ""}${Math.round(diff * 10) / 10} pts` : kpi.previous ? `${diff > 0 ? "+" : ""}${Math.round((diff / kpi.previous) * 100)}%` : "new";
  const tone = !kpi.better ? "neutral" : (diff > 0) === (kpi.better === "up") ? "good" : "bad";
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={styles.delta} data-tone={tone} title={`Previous window: ${formatKpi(kpi, kpi.previous)}`}><Icon size={12} aria-hidden="true" />{percent}</span>;
}

function Findings({ items }: { items: (Finding | { priority: Finding["severity"]; title: string; detail: string })[] }) {
  return <ol className={styles.findings}>{items.map(item => {
    const level = "severity" in item ? item.severity : item.priority;
    return <li key={item.title} data-level={level}><div><b>{item.title}</b><span className={styles.level}>{level}</span></div><p>{item.detail}</p></li>;
  })}</ol>;
}

const asText = (analysis: CopilotAnalysis, title: string) => [
  `${title} — AI analysis (${ist(analysis.generatedAt)} IST)`, "", analysis.summary,
  ...(analysis.findings.length ? ["", "Findings:", ...analysis.findings.map(f => `- [${f.severity}] ${f.title}: ${f.detail}`)] : []),
  ...(analysis.actions.length ? ["", "Actions:", ...analysis.actions.map(a => `- [${a.priority}] ${a.title}: ${a.detail}`)] : []),
].join("\n");

/**
 * The AI copilot at the top of a Super Admin page: the page's KPIs against the previous window and the records
 * needing attention (read from the database on load), then on request an AI analysis of the page's aggregates and
 * answers to questions about them. Moderation adds AI triage of open reports; Announcements adds an AI draft that
 * can be published in one click.
 */
export function SuperAdminCopilot({ page, title, days, query = "" }: { page: CopilotPage; title: string; days: number; query?: string }) {
  const meta = COPILOT_META[page];
  const [signals, setSignals] = useState<PageSignals | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<CopilotAnalysis | null>(() => typeof window === "undefined" ? null : cached(page, days));
  const [shownFor, setShownFor] = useState(`${page}:${days}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<CopilotAnalysis[]>([]);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  if (shownFor !== `${page}:${days}`) { setShownFor(`${page}:${days}`); setAnalysis(cached(page, days)); setAnswers([]); setError(""); setNote(""); }

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/super-admin/copilot?page=${page}&days=${days}`, { cache: "no-store", signal });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      if (!signal?.aborted) { setSignals(body); setLoadError(""); }
    } catch (failure) {
      if (!signal?.aborted) setLoadError(ERRORS[failure instanceof Error ? failure.message : ""] ?? "This page's signals could not be loaded. Check the database connection and try again.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [page, days]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); }); return () => controller.abort(); }, [load]);

  async function post(body: { question?: string }) {
    const response = await fetch("/api/super-admin/copilot", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, days, ...body }) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error ?? "service_error");
    return json as CopilotAnalysis;
  }
  async function analyse() {
    setBusy(true); setError(""); setNote("");
    try {
      const result = await post({});
      setAnalysis(result);
      try { sessionStorage.setItem(KEY(page, days), JSON.stringify(result)); } catch { /* storage blocked */ }
    } catch (failure) { setError(ERRORS[failure instanceof Error ? failure.message : ""] ?? "The analysis could not be generated. Try again in a moment."); }
    finally { setBusy(false); }
  }
  async function ask(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    setAsking(true); setError("");
    try {
      const result = await post({ question: trimmed });
      setAnswers(list => [result, ...list].slice(0, 5)); setQuestion("");
      // An announcement request answers with a draft too; show it where drafts live.
      if (result.draft) setAnalysis(current => current ? { ...current, draft: result.draft } : result);
    } catch (failure) { setError(ERRORS[failure instanceof Error ? failure.message : ""] ?? "The question could not be answered. Try again in a moment."); }
    finally { setAsking(false); }
  }
  async function publishDraft() {
    if (!analysis?.draft) return;
    setBusy(true); setNote("");
    try {
      const response = await fetch("/api/super-admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(analysis.draft) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? "service_error");
      setNote("Published. Learners see it on their next dashboard load.");
      window.dispatchEvent(new Event("admin:announcements-changed"));
      void load();
    } catch { setNote("The draft could not be published. Edit it in the form below and try again."); }
    finally { setBusy(false); }
  }
  async function copy(text: string, done: string) {
    try { await navigator.clipboard.writeText(text); setNote(done); } catch { setNote("Copying is blocked in this browser."); }
  }

  // Moderation: fold the AI triage into the report list, most severe first.
  const triage = useMemo(() => new Map((analysis?.triage ?? []).map(t => [t.ref, t])), [analysis]);
  const watchRows = useMemo(() => {
    const list = signals?.watch.rows ?? [];
    if (!triage.size) return list;
    return list.map(row => { const t = triage.get(String(row.ref)); return { ...row, ai_severity: t?.severity ?? null, ai_label: t ? `${t.label}: ${t.reason}` : null }; })
      .sort((a, b) => (SEVERITY_ORDER[a.ai_severity as keyof typeof SEVERITY_ORDER] ?? 3) - (SEVERITY_ORDER[b.ai_severity as keyof typeof SEVERITY_ORDER] ?? 3));
  }, [signals, triage]);
  const columns = useMemo<AdminColumn[]>(() => {
    const base = [...(signals?.watch.columns ?? []), ...(triage.size ? [{ key: "ai_severity", label: "AI severity" }, { key: "ai_label", label: "AI triage" }] : [])];
    return base.map(column => ({ ...column, render: row => { const value = row[column.key]; return typeof value === "string" && ISO.test(value) ? ist(value) : value === null || value === undefined || value === "" ? "—" : String(value); } }));
  }, [signals, triage]);

  const findings = analysis?.findings.length ? analysis.findings : signals?.findings ?? [];
  return <section className={styles.copilot} aria-labelledby={`copilot-${page}`} aria-busy={loading || busy}>
    <header className={styles.head}>
      <span className={styles.mark} aria-hidden="true"><Sparkles size={18} /></span>
      <div><h2 id={`copilot-${page}`}>AI copilot</h2><p>Live from the database for the last {days} day{days === 1 ? "" : "s"}, compared with the {days} day{days === 1 ? "" : "s"} before. Only aggregate figures are sent to the AI, never personal data.</p></div>
      <button type="button" className={styles.secondary} onClick={() => void load()} disabled={loading} aria-label="Reload page signals"><RefreshCw size={14} aria-hidden="true" className={loading ? styles.spin : undefined} />Reload</button>
      <button type="button" onClick={() => void analyse()} disabled={busy || loading}><Sparkles size={14} aria-hidden="true" className={busy ? styles.spin : undefined} />{busy ? "Analysing…" : analysis ? "Refresh analysis" : page === "moderation" ? "Analyse & triage" : page === "announcements" ? "Analyse & draft" : "Analyse with AI"}</button>
    </header>
    {loadError && <p role="alert" className={styles.error}>{loadError}</p>}
    {signals && <div className={styles.kpis}>{signals.kpis.map(kpi => <div key={kpi.label} className={styles.kpi}>
      <span>{kpi.label}</span><strong>{formatKpi(kpi, kpi.value)}</strong><Delta kpi={kpi} /><small>{kpi.note}</small>
    </div>)}</div>}
    {!signals && loading && <div className={styles.kpis} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <div key={i} className={`${styles.kpi} ${styles.skeleton}`} />)}</div>}
    {signals?.capped && <p className={styles.source}>This window holds more records than one read covers (10,000); figures are based on the most recent ones.</p>}

    {error && <p role="alert" className={styles.error}>{error}</p>}
    {analysis && <div className={styles.analysis}>
      <div className={styles.analysisHead}><h3>{analysis.source === "ai" ? "AI analysis" : "Threshold check"}</h3><button type="button" className={styles.ghost} onClick={() => void copy(asText(analysis, title), "Analysis copied.")}><ClipboardCopy size={13} aria-hidden="true" />Copy</button></div>
      <p className={styles.summary}>{analysis.summary}</p>
      {analysis.actions.length > 0 && <><h4>Recommended actions</h4><Findings items={analysis.actions} /></>}
    </div>}
    {findings.length > 0 && <div className={styles.block}><h4>{analysis?.findings.length ? "What the AI found" : "Signals crossing a threshold"}</h4><Findings items={[...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])} /></div>}
    {signals && !findings.length && !analysis && <p className={styles.empty}>No threshold crossed in this window. Run the AI analysis for a fuller read, or ask a question below.</p>}

    {analysis?.draft && <div className={styles.draft}>
      <h4><Megaphone size={14} aria-hidden="true" />AI-drafted announcement <span className={styles.level}>{analysis.draft.tone}</span></h4>
      <b>{analysis.draft.title}</b><p>{analysis.draft.body}</p>
      <div className={styles.row}><button type="button" onClick={() => void publishDraft()} disabled={busy}><Send size={13} aria-hidden="true" />Publish now</button><button type="button" className={styles.ghost} onClick={() => void copy(`${analysis.draft!.title}\n\n${analysis.draft!.body}`, "Draft copied. Paste it into the form below to edit or schedule it.")}><ClipboardCopy size={13} aria-hidden="true" />Copy to edit</button></div>
    </div>}
    {analysis && <p className={styles.source}>{analysis.source === "ai" ? `Written by ${analysis.model ?? "the configured model"}` : "No AI model available: findings come from fixed thresholds"} · {ist(analysis.generatedAt)} IST. Check figures before acting.</p>}
    {note && <p role="status" className={styles.note}>{note}</p>}

    <form className={styles.ask} onSubmit={e => { e.preventDefault(); void ask(question); }}>
      <label htmlFor={`copilot-ask-${page}`}><MessageSquareText size={14} aria-hidden="true" />Ask about {title.toLowerCase()}</label>
      <div className={styles.row}><input id={`copilot-ask-${page}`} value={question} maxLength={500} placeholder="e.g. What changed compared with the previous period?" onChange={e => setQuestion(e.target.value)} /><button type="submit" disabled={asking || question.trim().length < 3}><Send size={13} aria-hidden="true" />{asking ? "Thinking…" : "Ask"}</button></div>
      <ul className={styles.chips} aria-label="Suggested questions">{meta.questions.map(q => <li key={q}><button type="button" disabled={asking} onClick={() => void ask(q)}>{q}</button></li>)}</ul>
    </form>
    {answers.length > 0 && <ol className={styles.answers} aria-label="Answers">{answers.map(a => <li key={a.generatedAt}><b>{a.question}</b><p>{a.answer ?? a.summary}</p><small>{a.model} · {ist(a.generatedAt)} IST</small></li>)}</ol>}

    {signals && <AdminTable key={`${page}-${days}-${triage.size}`} title={meta.focus} rows={watchRows} columns={columns} query={query} note={signals.watch.note} empty="Nothing needs attention in this window." />}
  </section>;
}
