"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Bot, Brush, CheckCircle2, Clock, Database, Download, EyeOff, FileCheck2, Fingerprint, Gauge, Globe2, History, KeyRound, Lock, PlugZap, RefreshCw, Scale, ServerCrash, ShieldAlert, ShieldCheck, Siren, Sparkles, Target, UserCog, UserX, Webhook, XCircle } from "lucide-react";
import { AdminError } from "./super-admin-feedback";
import { TraceTable } from "./super-admin-trace-table";
import styles from "./super-admin-security.module.css";

/*
 * Security centre for the Super Admin Security page: which protective headers this site is serving right now, every
 * blocked request in the reporting window (who, what and why), the busiest sources and targets, and whether each
 * protective secret is configured. Data: /api/super-admin/security, recorded by lib/server/http.ts.
 */
type Data = {
  days: number; generatedAt: string; truncated: boolean;
  totals: { blocked: number; unauthenticated: number; forbidden: number; rateLimited: number; crossSite: number; adminProbes: number; serverErrors: number; uniqueSources: number };
  byCode: { name: string; count: number }[]; targets: { name: string; count: number }[];
  sources: { ip: string; count: number; last: string; codes: string[]; paths: string[]; admin: number; suspicious: boolean }[];
  timeline: { at: string; count: number }[];
  recent: { at: string; method: string; path: string | null; status: number | null; reason: string; ip: string | null; ua: string | null; requestId: string | null }[];
  posture: { name: string; what: string; configured: boolean }[];
  logs?: Logs;
  implementations?: { arcjet: boolean; rateLimitStore: boolean; webhookSignatures: boolean; encryption: boolean; visitorHashing: boolean };
};
type LogEntry = { at: string; actor: string | null; action: string; target: string | null; status: number | null; detail: string | null };
type Log = { count: number; rows: LogEntry[] };
type Logs = { privileged: Log; audit: Log; exports: Log; integrations: Log & { rejected: Log }; ai: Log; rateLimits: Log; crossSite: Log; oversized: Log };
const HEADERS: [string, string][] = [
  ["content-security-policy", "Content Security Policy (blocks framing, plugins, base hijacking)"], ["strict-transport-security", "HTTPS only (HSTS)"],
  ["x-frame-options", "Clickjacking protection"], ["x-content-type-options", "No MIME sniffing"], ["referrer-policy", "Referrer kept private"],
  ["permissions-policy", "Camera, microphone and location off"], ["cross-origin-opener-policy", "Window isolation (COOP)"],
];
const PROTECTIONS = [
  "Every admin API checks the signed-in Super Admin on the server; Upload Learning is owner-only.",
  "State-changing requests are refused from other websites (origin check), and auth cookies are SameSite.",
  "All input is validated with strict schemas and size limits before it reaches the database.",
  "Database tables use row level security; the browser never holds the service key.",
  "Sign-in, checkout, AI and tracking endpoints are rate limited per address.",
  "Payment and integration webhooks are verified by signature.",
  "User-supplied HTML is sanitised against an allowlist before it is shown.",
  "Blocked requests are recorded with their reason and source, and kept for 90 days.",
];
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function SuperAdminSecurityCenter({ days }: { days: number }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);
  const [headers, setHeaders] = useState<Record<string, boolean> | null>(null);
  const [query, setQuery] = useState("");
  const span = Math.min(90, Math.max(1, days));

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/security?days=${span}`, { cache: "no-store", signal: controller.signal })
      .then(async r => { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.error ?? "service_error"); setData(body); setError(""); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "service_error"); });
    // The headers this site is actually serving, read from a live response.
    fetch("/", { method: "HEAD", cache: "no-store", signal: controller.signal })
      .then(r => setHeaders(Object.fromEntries(HEADERS.map(([name]) => [name, r.headers.has(name)]))))
      .catch(() => { if (!controller.signal.aborted) setHeaders(null); });
    return () => controller.abort();
  }, [span, nonce]);

  const top = Math.max(1, ...(data?.timeline ?? []).map(t => t.count));
  const reasonTop = Math.max(1, ...(data?.byCode ?? []).map(c => c.count));
  const live = headers ? HEADERS.filter(([name]) => headers[name]).length : null;
  const https = typeof location !== "undefined" && location.protocol === "https:";

  if (error) return <AdminError>{error === "forbidden" ? "Only a Super Admin can view security events." : "Security events could not be loaded. Try Refresh in a moment."}</AdminError>;
  return <div className={styles.root}>
    <section className={styles.hero}>
      <span className={styles.heroMark} aria-hidden="true"><ShieldCheck size={22} /></span>
      <div><h2>Security centre</h2><p>Every request this site blocked in the last {span} day{span === 1 ? "" : "s"}, who sent it and why, plus the protections that are live right now.</p></div>
      <button type="button" className={styles.refresh} onClick={() => setNonce(n => n + 1)}><RefreshCw size={14} aria-hidden="true" />Refresh</button>
    </section>

    {data && <div className={styles.tiles}>
      <Tile tone="rose" icon={ShieldAlert} label="Blocked requests" value={data.totals.blocked} note={`${data.totals.uniqueSources} distinct sources`} />
      <Tile tone="peach" icon={Siren} label="Admin API probes" value={data.totals.adminProbes} note="Refused calls to /api/super-admin" />
      <Tile tone="lavender" icon={UserX} label="Not signed in" value={data.totals.unauthenticated} note="401 responses" />
      <Tile tone="sky" icon={Ban} label="Forbidden" value={data.totals.forbidden} note="403: wrong account or origin" />
      <Tile tone="butter" icon={Clock} label="Rate limited" value={data.totals.rateLimited} note="429: too many requests" />
      <Tile tone="mint" icon={Globe2} label="Cross-site blocked" value={data.totals.crossSite} note="Requests from other websites" />
      <Tile tone="slate" icon={ServerCrash} label="Server errors" value={data.totals.serverErrors} note="5xx, worth investigating" />
      <Tile tone="mint" icon={Lock} label="Security headers" value={live ?? 0} note={live == null ? "Checking…" : `${live} of ${HEADERS.length} live`} />
    </div>}

    <div className={styles.grid}>
      <section className={styles.card} data-tone="sky" aria-labelledby="sec-headers">
        <h3 id="sec-headers"><Lock size={16} aria-hidden="true" />Protective headers, live</h3>
        <ul className={styles.checks}>{HEADERS.map(([name, what]) => {
          const ok = headers?.[name];
          const pending = name === "strict-transport-security" && !https && !ok;
          return <li key={name} data-ok={ok ?? undefined}>
            {ok ? <CheckCircle2 size={15} aria-label="On" /> : pending ? <Clock size={15} aria-label="Only over HTTPS" /> : <XCircle size={15} aria-label="Missing" />}
            <span><b>{what}</b><small>{name}{pending ? " · sent only over HTTPS (production)" : ""}</small></span>
          </li>;
        })}</ul>
      </section>
      <section className={styles.card} data-tone="mint" aria-labelledby="sec-posture">
        <h3 id="sec-posture"><KeyRound size={16} aria-hidden="true" />Secrets and protections</h3>
        <ul className={styles.checks}>{(data?.posture ?? []).map(p => <li key={p.name} data-ok={p.configured || undefined}>
          {p.configured ? <CheckCircle2 size={15} aria-label="Configured" /> : <AlertTriangle size={15} aria-label="Not configured" />}
          <span><b>{p.what}</b><small>{p.name} {p.configured ? "is set" : "is not set in this environment"}</small></span>
        </li>)}</ul>
        <details className={styles.layers}><summary>Protections in place ({PROTECTIONS.length})</summary><ul>{PROTECTIONS.map(p => <li key={p}><ShieldCheck size={13} aria-hidden="true" />{p}</li>)}</ul></details>
      </section>
    </div>

    {data && <Implementations data={data} headersLive={live} />}
    {data?.logs && <SecurityLogs logs={data.logs} />}

    {data && <div className={styles.grid}>
      <section className={styles.card} data-tone="rose" aria-labelledby="sec-timeline">
        <h3 id="sec-timeline"><ShieldAlert size={16} aria-hidden="true" />Blocked over time</h3>
        {data.timeline.length ? <ol className={styles.timeline} aria-label="Blocked requests over time">{data.timeline.map(t => {
          const text = `${span <= 1 ? t.at.slice(11) : new Date(t.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${t.count} blocked`;
          return <li key={t.at} tabIndex={0} aria-label={text} data-tip={text}><span style={{ height: `${Math.max(4, (t.count / top) * 100)}%` }} /></li>;
        })}</ol> : <p className={styles.empty}><CheckCircle2 size={15} aria-hidden="true" />Nothing blocked in this window.</p>}
      </section>
      <section className={styles.card} data-tone="lavender" aria-labelledby="sec-reasons">
        <h3 id="sec-reasons"><Fingerprint size={16} aria-hidden="true" />Why requests were blocked</h3>
        {data.byCode.length ? <ul className={styles.bars}>{data.byCode.map(c => <li key={c.name}><span>{c.name}</span><i><b style={{ width: `${(c.count / reasonTop) * 100}%` }} /></i><strong>{c.count}</strong></li>)}</ul> : <p className={styles.empty}>No blocked requests.</p>}
      </section>
    </div>}

    {data && <div className={styles.grid}>
      <section className={styles.card} data-tone="peach" aria-labelledby="sec-sources">
        <h3 id="sec-sources"><Siren size={16} aria-hidden="true" />Top sources</h3>
        {data.sources.length ? <ul className={styles.sources}>{data.sources.map(s => <li key={s.ip} data-suspicious={s.suspicious || undefined}>
          <div><code>{s.ip}</code>{s.suspicious && <span className={styles.flag}><AlertTriangle size={11} aria-hidden="true" />Suspicious</span>}<button type="button" onClick={() => { setQuery(`ip:${s.ip}`); document.getElementById("sec-log")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Trace</button></div>
          <small>{s.count} blocked · {s.admin} on admin API · last {when(s.last)}</small>
          <small>{s.codes.join(", ")}</small>
        </li>)}</ul> : <p className={styles.empty}>No sources to show.</p>}
      </section>
      <section className={styles.card} data-tone="butter" aria-labelledby="sec-targets">
        <h3 id="sec-targets"><Target size={16} aria-hidden="true" />Most targeted endpoints</h3>
        {data.targets.length ? <ul className={styles.bars}>{data.targets.map(t => <li key={t.name}><code>{t.name}</code><i><b style={{ width: `${(t.count / (data.targets[0]?.count || 1)) * 100}%` }} /></i><strong>{t.count}</strong></li>)}</ul> : <p className={styles.empty}>No endpoints targeted.</p>}
      </section>
    </div>}

    {data && <TraceTable rows={data.recent} query={query} onQuery={setQuery} truncated={data.truncated} />}
  </div>;
}

type Status = "live" | "off" | "always";
/**
 * One light card per protective layer this application implements: what it is for (in one line), how it works here,
 * whether it is configured in this environment, and the figure from this window that shows it working.
 */
function Implementations({ data, headersLive }: { data: Data; headersLive: number | null }) {
  const on = data.implementations; const t = data.totals; const logs = data.logs;
  const live = (value: boolean | undefined): Status => value === undefined ? "always" : value ? "live" : "off";
  const cards: { tone: string; icon: typeof ShieldCheck; title: string; purpose: string; how: string; status: Status; metric?: string }[] = [
    { tone: "rose", icon: Bot, title: "Edge shield & bot detection", purpose: "Stops SQL-injection and XSS probes and scraping bots before they reach the application.", how: "Arcjet runs in the proxy on every request; search engines and uptime monitors stay allowed.", status: live(on?.arcjet), metric: "Blocks are listed in the Arcjet dashboard" },
    { tone: "butter", icon: Gauge, title: "Rate limiting", purpose: "Prevents password guessing, scraping and runaway AI costs from one source.", how: "Upstash sliding window of 60 API calls a minute per address, plus tighter limits on sign-in, checkout and tracking.", status: live(on?.rateLimitStore), metric: `${t.rateLimited} requests slowed down` },
    { tone: "lavender", icon: Fingerprint, title: "Authentication & sessions", purpose: "Proves who is making each request, so private learning data stays private.", how: "Supabase Auth with HTTP-only cookies, refreshed in the proxy; protected routes redirect to sign-in.", status: "always", metric: `${t.unauthenticated} anonymous calls refused` },
    { tone: "peach", icon: UserCog, title: "Role-based admin access", purpose: "Keeps this console and its data to Super Admins, even if a link leaks.", how: "Every /api/super-admin route checks the signed-in role on the server before reading anything.", status: "always", metric: `${t.adminProbes} admin API probes refused` },
    { tone: "mint", icon: Database, title: "Row level security", purpose: "The database itself refuses rows that are not yours: a second wall behind the app code.", how: "Postgres RLS policies on public tables; the service key never reaches the browser.", status: "always" },
    { tone: "sky", icon: Globe2, title: "Cross-site request protection", purpose: "Stops other websites from submitting actions with a signed-in learner’s cookies (CSRF).", how: "State-changing requests must come from this site’s own origin; cookies are SameSite.", status: "always", metric: `${t.crossSite} cross-site requests blocked` },
    { tone: "slate", icon: Scale, title: "Input validation & size limits", purpose: "Rejects malformed or oversized input before it reaches the database or an AI model.", how: "Strict Zod schemas and request body limits on every API route.", status: "always", metric: logs ? `${logs.oversized.count} oversized requests refused` : undefined },
    { tone: "sky", icon: Lock, title: "Browser security headers", purpose: "Tells browsers to block clickjacking, MIME sniffing, HTTP downgrades and unwanted device access.", how: "CSP frame-ancestors, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and COOP on every response.", status: headersLive == null ? "always" : headersLive > 0 ? "live" : "off", metric: headersLive == null ? undefined : `${headersLive} of ${HEADERS.length} headers live` },
    { tone: "peach", icon: Webhook, title: "Webhook signatures", purpose: "Only Razorpay can mark a payment as paid; forged callbacks are rejected.", how: "Each payment webhook’s HMAC signature is checked with the shared secret before it is processed.", status: live(on?.webhookSignatures), metric: logs ? `${logs.integrations.rejected.count} bad signatures rejected` : undefined },
    { tone: "lavender", icon: KeyRound, title: "Credential encryption", purpose: "A leaked database backup does not expose connected-account tokens.", how: "Integration credentials are encrypted with AES-256-GCM before they are stored.", status: live(on?.encryption) },
    { tone: "mint", icon: EyeOff, title: "Privacy-preserving analytics", purpose: "Counts visitors and locations without keeping anyone’s full IP address.", how: "The last part of each IP is zeroed, and distinct networks are counted by a keyed hash.", status: live(on?.visitorHashing) },
    { tone: "rose", icon: Brush, title: "HTML sanitisation", purpose: "Stops stored cross-site scripting through notes and published documents.", how: "User-written HTML is cleaned against an allowlist of tags and attributes before it is shown.", status: "always" },
    { tone: "butter", icon: History, title: "Audit trail & retention", purpose: "Answers who changed what and when, after an incident or a dispute.", how: "Database triggers record role, ban and table changes; admin actions are logged; request logs are kept 90 days.", status: "always", metric: logs ? `${logs.privileged.count + logs.audit.count} audit entries` : undefined },
    { tone: "slate", icon: Sparkles, title: "AI provider safeguards", purpose: "Keeps AI features working, and visible, when a provider fails or throttles.", how: "Failed completions fall back to another provider and every fallback is recorded.", status: "always", metric: logs ? `${logs.ai.count} fallbacks or failures` : undefined },
  ];
  const labelOf: Record<Status, string> = { live: "Configured", off: "Not configured here", always: "Built in" };
  return <section aria-labelledby="sec-impl" className={styles.block}>
    <div className={styles.blockHead}><h3 id="sec-impl"><ShieldCheck size={16} aria-hidden="true" />Security implementations</h3><p>Each protective layer in this application, what it is for and whether it is active in this environment.</p></div>
    <ul className={styles.implGrid}>{cards.map(({ tone, icon: Icon, title, purpose, how, status, metric }) => <li key={title} className={styles.card} data-tone={tone}>
      <div className={styles.implHead}><span className={styles.tileIcon} aria-hidden="true"><Icon size={15} /></span><h4>{title}</h4><span className={styles.badge} data-status={status}>{labelOf[status]}</span></div>
      <p className={styles.purpose}><b>Purpose:</b> {purpose}</p>
      <p className={styles.how}>{how}</p>
      {metric && <p className={styles.metric}>{metric}</p>}
    </li>)}</ul>
  </section>;
}

/** One light card per security log: why the log exists, its count in the window and its latest entries. */
function SecurityLogs({ logs }: { logs: Logs }) {
  const integrations: Log = { count: logs.integrations.count + logs.integrations.rejected.count, rows: [...logs.integrations.rejected.rows, ...logs.integrations.rows].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25) };
  const sections: { tone: string; icon: typeof ShieldCheck; title: string; purpose: string; log: Log; empty: string }[] = [
    { tone: "lavender", icon: UserCog, title: "Privileged changes", purpose: "Role grants, bans, credit and usage adjustments: the actions that change what someone can do.", log: logs.privileged, empty: "No privileged changes in this window." },
    { tone: "slate", icon: FileCheck2, title: "Database audit trail", purpose: "Row changes recorded by database triggers, to reconstruct what happened to a record.", log: logs.audit, empty: "No audited table changes in this window." },
    { tone: "sky", icon: Download, title: "Data exports", purpose: "Every download of notes, notebooks or activity CSVs, so bulk data leaving the site is visible.", log: logs.exports, empty: "No exports in this window." },
    { tone: "peach", icon: PlugZap, title: "Webhooks & integrations", purpose: "Calls to connected services, and webhooks rejected for a bad signature (possible forgery).", log: integrations, empty: "No integration calls or rejected webhooks." },
    { tone: "rose", icon: Clock, title: "Rate-limit log", purpose: "Sources that sent too many requests: brute force, scrapers or a broken client.", log: logs.rateLimits, empty: "Nobody hit a rate limit." },
    { tone: "mint", icon: Globe2, title: "Cross-site blocks", purpose: "State-changing requests that came from another website, the signature of a CSRF attempt.", log: logs.crossSite, empty: "No cross-site requests blocked." },
    { tone: "butter", icon: Sparkles, title: "AI provider fallbacks", purpose: "AI calls that failed or switched provider: outages, throttling or abusive prompts.", log: logs.ai, empty: "Every AI call succeeded first time." },
    { tone: "slate", icon: Scale, title: "Oversized requests", purpose: "Bodies larger than a route allows, often a denial-of-service or upload-abuse attempt.", log: logs.oversized, empty: "No oversized requests." },
  ];
  return <section aria-labelledby="sec-logs" className={styles.block}>
    <div className={styles.blockHead}><h3 id="sec-logs"><History size={16} aria-hidden="true" />Security logs</h3><p>The latest 25 entries of each log; counts cover the whole window.</p></div>
    <div className={styles.grid}>{sections.map(({ tone, icon: Icon, title, purpose, log, empty }) => <section key={title} className={styles.card} data-tone={tone} aria-label={title}>
      <h3><Icon size={16} aria-hidden="true" />{title}<span className={styles.count}>{log.count.toLocaleString("en-IN")}</span></h3>
      <p className={styles.purpose}><b>Purpose:</b> {purpose}</p>
      {log.rows.length ? <ol className={styles.logList}>{log.rows.map((r, i) => <li key={`${r.at}-${i}`}>
        <div><code>{r.action}</code>{r.status != null && <span className={styles.status}>{r.status}</span>}<time dateTime={r.at}>{when(r.at)}</time></div>
        <small>{[r.target && `Target: ${r.target}`, r.actor && `By: ${r.actor}`, r.detail].filter(Boolean).join(" · ") || "No further detail recorded"}</small>
      </li>)}</ol> : <p className={styles.empty}><CheckCircle2 size={15} aria-hidden="true" />{empty}</p>}
    </section>)}</div>
  </section>;
}

function Tile({ tone, icon: Icon, label, value, note }: { tone: string; icon: typeof ShieldCheck; label: string; value: number; note: string }) {
  return <div className={styles.tile} data-tone={tone}><span className={styles.tileIcon} aria-hidden="true"><Icon size={15} /></span><span className={styles.tileLabel}>{label}</span><strong>{value.toLocaleString("en-IN")}</strong><small>{note}</small></div>;
}
