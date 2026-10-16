"use client";
import { AdminError, AdminLoading } from "./super-admin-feedback";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { AdminTable } from "./super-admin-table";
import { Button } from "./ui/button";

import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, CircleCheck, CircleSlash, PlugZap, RefreshCw, Sparkles } from "lucide-react";
import type { AiBreakdown, AiInsights } from "@/lib/ai-insights";
import styles from "./super-admin-dashboard.module.css";

type ProviderStatus = { id: string; label: string; configured: boolean; model: string | null; grounded: boolean; isDefault: boolean; isLearning: boolean };
type Snapshot = { generatedAt: string; days: number; capped: boolean; sampled: number; insights: AiInsights; providers: ProviderStatus[] };
type Probe = { ok: boolean; latencyMs: number; model?: string; reason?: string };

const count = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const ms = (n: number | null) => n === null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${n} ms`;
const pct = (n: number) => `${(n * 100).toFixed(n && n < 0.1 ? 1 : 0)}%`;
const usd = (n: number | null) => n === null ? "Not reported" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 1 ? 4 : 2 }).format(n);

function Breakdown({ title, rows, query, note }: { title: string; rows: AiBreakdown[]; query: string; note?: string }) {
  const top = Math.max(1, ...rows.map(row => row.calls));
  return <AdminTable title={title} rows={rows as unknown as Record<string, unknown>[]} query={query} note={note} empty="No AI calls recorded in this window." rowKey={row => String(row.key)}
    columns={[
      { key: "key", label: "Name" },
      { key: "calls", label: "Calls", filter: false, render: row => count(Number(row.calls)) },
      { key: "share", label: "Share", filter: false, render: row => <span className={styles.shareBar} style={{ "--share": `${(Number(row.calls) / top) * 100}%` } as React.CSSProperties} aria-hidden="true" /> },
      { key: "errorRate", label: "Error rate", filter: false, render: row => <span className={Number(row.errorRate) >= 0.1 ? styles.warn : undefined}>{pct(Number(row.errorRate))}</span> },
      { key: "p50", label: "p50", filter: false, render: row => ms(row.p50 as number | null) }, { key: "p95", label: "p95", filter: false, render: row => ms(row.p95 as number | null) },
      { key: "inputTokens", label: "Input tokens", filter: false, render: row => count(Number(row.inputTokens)) }, { key: "outputTokens", label: "Output tokens", filter: false, render: row => count(Number(row.outputTokens)) },
      { key: "costUsd", label: "Cost", filter: false, render: row => usd(row.costUsd as number | null) }, { key: "fallbacks", label: "Fallbacks", filter: false, render: row => String(row.fallbacks || "—") },
    ]} />;
}

function Trend({ days }: { days: AiInsights["daily"] }) {
  if (!days.length) return null;
  const top = Math.max(1, ...days.map(day => day.calls));
  return <Card className={styles.panel}><div className={styles.panelHeading}><h2>Daily AI calls</h2><span>Failures in clay · UTC days</span></div>
    <ol className={styles.trend} aria-label="Daily AI calls">{days.map(day => <li key={day.day} title={`${day.day}: ${day.calls} calls, ${day.failures} failed, ${count(day.tokens)} tokens`}>
      <span className={styles.trendBar} style={{ "--h": `${(day.calls / top) * 100}%`, "--f": `${day.calls ? (day.failures / day.calls) * 100 : 0}%` } as React.CSSProperties} />
      <small>{day.day.slice(5)}</small><span className={styles.srOnly}>{day.day}: {day.calls} calls, {day.failures} failed</span>
    </li>)}</ol>
  </Card>;
}

/**
 * The AI section of the super admin dashboard: usage, reliability and cost per
 * provider, model and feature; every provider's configuration with a live
 * test; rule-based findings; and an on-demand AI-written analysis. Prompts and
 * answers are never recorded, so none of this can show learner content.
 */
export function SuperAdminAi({ days, query }: { days: number; query: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [probes, setProbes] = useState<Record<string, Probe | "running">>({});
  const [analysis, setAnalysis] = useState<{ text: string; label: string; model: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/super-admin/ai?days=${days}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Super admin access is required." : "AI analytics are unavailable. Check the database connection and migration 0018.");
      const snapshot: Snapshot = await response.json();
      if (!signal?.aborted) { setData(snapshot); setError(""); }
    } catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : "Unable to load AI analytics."); }
    finally { if (!signal?.aborted) setBusy(false); }
  }, [days]);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { if (!controller.signal.aborted) void refresh(controller.signal); });
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refresh]);

  async function post(body: unknown) {
    const response = await fetch("/api/super-admin/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (response.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
    if (response.status === 409) throw new Error("No AI provider is configured for this deployment.");
    if (!response.ok) throw new Error("The request failed. Try again.");
    return response.json();
  }
  async function probe(id: string) {
    setProbes(current => ({ ...current, [id]: "running" }));
    try { const result: Probe = await post({ action: "probe", provider: id }); setProbes(current => ({ ...current, [id]: result })); }
    catch (failure) { setProbes(current => ({ ...current, [id]: { ok: false, latencyMs: 0, reason: failure instanceof Error ? failure.message : "failed" } })); }
  }
  async function analyze() {
    setAnalyzing(true); setAnalysisError("");
    try { const result = await post({ action: "analyze", days }); setAnalysis({ text: result.analysis, label: result.label, model: result.model }); }
    catch (failure) { setAnalysisError(failure instanceof Error ? failure.message : "Analysis failed."); }
    finally { setAnalyzing(false); }
  }

  if (!data) return error ? <AdminError>{error}</AdminError> : <AdminLoading>Loading AI analytics...</AdminLoading>;
  const { insights, providers } = data;
  const { totals } = insights;
  const configured = providers.filter(item => item.configured);
  return <>
    {error && <AdminError>{error} Showing the previous snapshot.</AdminError>}
    <div className={styles.toolbar}><span>{count(data.sampled)} AI events · updated {new Date(data.generatedAt).toLocaleTimeString()}{data.capped && " · capped at the most recent 20,000"}</span><Button variant="outline" className={styles.refresh} disabled={busy} onClick={() => void refresh()}><RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh AI analytics</Button></div>
    <div className={styles.metrics}>
      <Card className={styles.metric}><span>AI calls</span><strong>{count(totals.calls)}</strong><small>{configured.length} of {providers.length} providers configured</small></Card>
      <Card className={styles.metric}><span>Success rate</span><strong>{totals.calls ? pct(1 - totals.errorRate) : "—"}</strong><small>{count(totals.failures)} failed calls in this window</small></Card>
      <Card className={styles.metric}><span>Latency p50 / p95</span><strong>{ms(totals.p50)}</strong><small>p95 {ms(totals.p95)} · whole call, including network</small></Card>
      <Card className={styles.metric}><span>Tokens</span><strong>{count(totals.tokens)}</strong><small>{count(totals.inputTokens)} in · {count(totals.outputTokens)} out</small></Card>
      <Card className={styles.metric}><span>Reported cost</span><strong>{usd(totals.costUsd)}</strong><small>{totals.costedCalls ? `From ${count(totals.costedCalls)} calls whose provider reports cost (OpenRouter)` : "Only providers that return cost per call are summed"}</small></Card>
      <Card className={styles.metric}><span>Provider fallbacks</span><strong>{count(totals.fallbacks)}</strong><small>Requests moved to another provider after a refusal or 429</small></Card>
    </div>

    <Card className={styles.panel}><div className={styles.panelHeading}><h2><Activity size={16} /> Findings</h2><span>Rule-based, always on</span></div>
      <ul className={styles.findings}>{insights.findings.map(item => <li key={item}>{item}</li>)}</ul>
    </Card>

    <Card className={styles.panel}><div className={styles.panelHeading}><h2><Sparkles size={16} /> AI analysis</h2><Button variant="outline" className={styles.refresh} disabled={analyzing || !configured.length} onClick={() => void analyze()}><Bot size={15} /> {analyzing ? "Analyzing…" : analysis ? "Analyze again" : "Analyze with AI"}</Button></div>
      <p className={styles.note}>Sends only the aggregated numbers above (no prompts, answers or user data) to the default provider and asks for prioritised recommendations. Each run is one AI call.</p>
      {analysisError && <AdminError>{analysisError}</AdminError>}
      {analysis && <Card className={styles.analysis} aria-live="polite"><div className={styles.analysisText}>{analysis.text}</div><small>Written by {analysis.label} · {analysis.model}</small></Card>}
    </Card>

    <Card className={styles.panel}><div className={styles.panelHeading}><h2><PlugZap size={16} /> Providers</h2><span>Keys stay on the server</span></div>
      <p className={styles.note}>Set each provider&apos;s key (and model where required) in the environment. “Test” sends a 16-token request and reports its round trip.</p>
      <div className={styles.providerGrid}>{providers.map(item => { const state = probes[item.id]; return <Card key={item.id} className={styles.providerCard} data-on={item.configured || undefined}>
        <header>{item.configured ? <CircleCheck size={16} aria-hidden="true" /> : <CircleSlash size={16} aria-hidden="true" />}<strong>{item.label}</strong>{item.isDefault && <Badge variant="secondary">default</Badge>}{item.isLearning && <Badge variant="secondary">learning</Badge>}{item.grounded && <Badge variant="secondary">grounded</Badge>}</header>
        <p>{item.configured ? <code>{item.model}</code> : "Not configured"}</p>
        {item.configured && <Button variant="outline" className={styles.refresh} disabled={state === "running"} onClick={() => void probe(item.id)}>{state === "running" ? "Testing…" : "Test"}</Button>}
        {state && state !== "running" && <small role="status" data-ok={state.ok || undefined}>{state.ok ? `OK in ${ms(state.latencyMs)}` : `Failed: ${state.reason}`}</small>}
      </Card>; })}</div>
    </Card>

    <Trend days={insights.daily} />
    <Breakdown title="By provider" rows={insights.providers} query={query} note="Calls made before provider tracking was added count as Claude." />
    <Breakdown title="By model" rows={insights.models} query={query} />
    <Breakdown title="By feature" rows={insights.features} query={query} note="Features are the app surfaces that asked: mentor (Study Buddy), answer (Search), lesson, quiz, interview, api-reference and more." />
    {insights.errors.length > 0 && <Card className={styles.panel}><div className={styles.panelHeading}><h2>Failures by status</h2><span>{count(totals.failures)} failed calls</span></div>
      <ul className={styles.findings}>{insights.errors.map(item => <li key={item.status}><b>{item.status === 502 ? "502 / network or timeout" : `HTTP ${item.status}`}</b>: {count(item.count)}</li>)}</ul></Card>}
    {insights.slowest.length > 0 && <AdminTable title="Slowest calls" rows={insights.slowest as unknown as Record<string, unknown>[]} query={query} note="The ten slowest calls in this window."
      columns={["created_at", "feature", "provider", "model", { key: "duration_ms", label: "Duration", filter: false, render: row => ms(Number(row.duration_ms)) }, "status"]} />}
  </>;
}
