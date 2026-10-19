"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Ban, CheckCircle2, Clock, Fingerprint, Globe2, KeyRound, Lock, RefreshCw, Search, ServerCrash, ShieldAlert, ShieldCheck, Siren, Target, UserX, XCircle } from "lucide-react";
import { AdminError } from "./super-admin-feedback";
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
};
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

  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.recent ?? []).filter(r => !q || [r.ip, r.path, r.reason, r.requestId, r.ua].some(v => v?.toLowerCase().includes(q)));
  }, [data, query]);
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
          <div><code>{s.ip}</code>{s.suspicious && <span className={styles.flag}><AlertTriangle size={11} aria-hidden="true" />Suspicious</span>}<button type="button" onClick={() => setQuery(s.ip)}>Trace</button></div>
          <small>{s.count} blocked · {s.admin} on admin API · last {when(s.last)}</small>
          <small>{s.codes.join(", ")}</small>
        </li>)}</ul> : <p className={styles.empty}>No sources to show.</p>}
      </section>
      <section className={styles.card} data-tone="butter" aria-labelledby="sec-targets">
        <h3 id="sec-targets"><Target size={16} aria-hidden="true" />Most targeted endpoints</h3>
        {data.targets.length ? <ul className={styles.bars}>{data.targets.map(t => <li key={t.name}><code>{t.name}</code><i><b style={{ width: `${(t.count / (data.targets[0]?.count || 1)) * 100}%` }} /></i><strong>{t.count}</strong></li>)}</ul> : <p className={styles.empty}>No endpoints targeted.</p>}
      </section>
    </div>}

    {data && <section className={styles.card} data-tone="slate" aria-labelledby="sec-log">
      <div className={styles.logHead}>
        <h3 id="sec-log"><Search size={16} aria-hidden="true" />Trace blocked requests</h3>
        <div className={styles.search}><Search size={14} aria-hidden="true" /><input type="search" aria-label="Search blocked requests" placeholder="IP, path, reason or request id…" value={query} onChange={e => setQuery(e.target.value)} /></div>
      </div>
      {recent.length ? <div className={styles.tableWrap}><table className={styles.table}>
        <thead><tr><th>When</th><th>Request</th><th>Status</th><th>Reason</th><th>Source</th><th>Request id</th></tr></thead>
        <tbody>{recent.map((r, i) => <tr key={`${r.requestId ?? i}`}>
          <td data-label="When">{when(r.at)}</td>
          <td data-label="Request"><code>{r.method} {r.path}</code></td>
          <td data-label="Status"><span className={styles.status}>{r.status}</span></td>
          <td data-label="Reason">{r.reason}</td>
          <td data-label="Source"><code>{r.ip ?? "—"}</code>{r.ua && <small title={r.ua}>{r.ua.slice(0, 48)}</small>}</td>
          <td data-label="Request id"><code className={styles.small}>{r.requestId ?? "—"}</code></td>
        </tr>)}</tbody>
      </table></div> : <p className={styles.empty}>{query ? "No blocked request matches your search." : "No blocked requests in this window."}</p>}
      <p className={styles.note}>Recorded for every API request refused for sign-in, permission, origin, size or rate limits, with the source address and browser, and kept 90 days.{data.truncated ? " Showing the most recent 5,000 failed requests." : ""} The request id matches the X-Request-ID response header and the server logs.</p>
    </section>}
  </div>;
}

function Tile({ tone, icon: Icon, label, value, note }: { tone: string; icon: typeof ShieldCheck; label: string; value: number; note: string }) {
  return <div className={styles.tile} data-tone={tone}><span className={styles.tileIcon} aria-hidden="true"><Icon size={15} /></span><span className={styles.tileLabel}>{label}</span><strong>{value.toLocaleString("en-IN")}</strong><small>{note}</small></div>;
}
