"use client";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Bot, CheckCircle2, CircleAlert, Compass, ExternalLink, Gauge, Globe2, KeyRound, Link2, ListChecks, Loader2, Plus, Radar, RefreshCw, Search, Sparkles, Swords, Target, Trash2, TrendingDown, TrendingUp, TriangleAlert, type LucideIcon } from "lucide-react";
import styles from "./super-admin-seo.module.css";

/*
 * The Super Admin "SEO Audit" page: a search and AI visibility suite on Supabase (lib/server/seo-suite.ts, migration 0049).
 * Dashboard → Site audit → Rank tracker → Site explorer → Keywords explorer → Competitors → AI visibility.
 * Site audit works with no keys; Search Console, the Ahrefs API and AI search light up as their credentials are added.
 */

type Row = Record<string, unknown>;
type Issue = { code: string; severity: "error" | "warning" | "notice"; message: string };
type AuditPage = { url: string; status: number | null; load_ms: number | null; title: string | null; description: string | null; h1_count: number; word_count: number; images: number; images_missing_alt: number; canonical: string | null; noindex: boolean; internal_links: number; issues: Issue[] };
type Audit = { id: number; started_at: string; finished_at: string | null; status: string; pages_crawled: number; issues_count: number; score: number | null; error: string | null;
  summary: { errors?: number; warnings?: number; notices?: number; healthy?: number; brokenLinks?: number; linksChecked?: number; avgMs?: number; byCode?: Record<string, { severity: Issue["severity"]; pages: number; message: string }> } };
type Keyword = { id: number; keyword: string; country: string; target_url: string | null; created_at: string };
type Rank = { keyword_id: number; day: string; position: number | null; clicks: number; impressions: number; ctr: number | null; page: string | null };
type Snapshot = { id: number; tool: string; target: string; params: { country?: string }; data: unknown; fetched_at: string };
type Prompt = { id: number; prompt: string; created_at: string };
type Check = { id: number; prompt_id: number; checked_at: string; engine: string; mentioned: boolean; cited: boolean; cited_rank: number | null; competitors_cited: string[]; answer: string | null; citations: { url: string; title: string }[] };
type SearchRow = { clicks: number; impressions: number; ctr: number; position: number; keys: string[] };
type Overview = {
  generatedAt: string; domain: string; connections: { ahrefs: boolean; searchConsole: boolean; aiSearch: boolean };
  status: { searchConsole: { connected: boolean; property: string | null; error: string | null };
    ahrefs: { connected: boolean; error: string | null; plan: string | null; unitsLeft: number | null; unitsLimit: number | null; resetsOn: string | null } };
  audits: Audit[]; lastAudit: Audit | null; auditPages: AuditPage[]; keywords: Keyword[]; history: Rank[];
  snapshots: Snapshot[]; domainHistory: Snapshot[]; competitors: { id: number; domain: string }[]; prompts: Prompt[]; checks: Check[];
  search: { status: string; property: string; startDate: string; endDate: string; totals: { clicks: number; impressions: number; ctr: number; position: number } | null; daily: SearchRow[]; queries: SearchRow[]; pages: SearchRow[]; countries: SearchRow[] } | null;
  searchError: string | null;
};
type Tab = "dashboard" | "audit" | "ranks" | "explorer" | "keywords" | "competitors" | "ai";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge }, { id: "audit", label: "Site audit", icon: ListChecks }, { id: "ranks", label: "Rank tracker", icon: TrendingUp },
  { id: "explorer", label: "Site explorer", icon: Globe2 }, { id: "keywords", label: "Keywords explorer", icon: KeyRound }, { id: "competitors", label: "Competitors", icon: Swords },
  { id: "ai", label: "AI visibility", icon: Bot },
];
const n = (value: unknown, digits = 0) => typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-IN", { maximumFractionDigits: digits }) : "—";
const pct = (value: number | null | undefined) => value == null ? "—" : `${(value * 100).toFixed(1)}%`;
const when = (iso?: string | null) => iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso)) : "—";
const path = (url: string) => { try { const u = new URL(url); return u.pathname + u.search || "/"; } catch { return url; } };
const ERRORS: Record<string, string> = {
  migration_required: "Apply migration 0049 (SEO suite) in Supabase to store audits, keywords, snapshots and AI checks.",
  ahrefs_not_configured: "Add AHREFS_API_KEY (an Ahrefs API v3 key) to the environment to use Ahrefs data.",
  ahrefs_auth_failed: "Ahrefs rejected the API key. Check that it is valid and that your plan includes API access.",
  ahrefs_rate_limited: "Ahrefs rate limit reached. Try again in a minute.", ahrefs_unavailable: "Ahrefs did not answer. Try again shortly.",
  search_console_not_configured: "Add the GOOGLE_SEARCH_CONSOLE_* service-account variables to use Search Console data.",
  search_console_access_denied: "The service account has no access to this Search Console property. Add it as a user in Search Console.",
  search_console_auth_failed: "Google rejected the service-account key. Check GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL and GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY.",
  search_console_no_property: "The service account can't read any Search Console property for this site yet. Add its email as a user of the property (step 3).",
  search_console_unavailable: "Google Search Console did not answer. Try again shortly.", search_console_rate_limited: "Search Console rate limit reached. Try again in a minute.",
  ai_search_not_configured: "Add PERPLEXITY_API_KEY to check AI-search visibility.", keywords_required: "Enter at least one keyword.",
  rate_limited: "Too many runs in a short time. Wait a few minutes.",
};
const say = (code: string) => ERRORS[code] ?? "That did not work. Try again.";

async function call(body: Record<string, unknown>) {
  const response = await fetch("/api/super-admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error ?? "service_error");
  return json;
}

/** Ahrefs answers wrap lists in one key; snapshots store what is inside, so a list or an object comes back. */
const listOf = (data: unknown): Row[] => Array.isArray(data) ? data as Row[] : data && typeof data === "object" ? (Object.values(data).find(Array.isArray) as Row[] | undefined) ?? [] : [];

export function SuperAdminSeo() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [running, setRunning] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/super-admin/seo", { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error ?? "service_error");
      setData(json); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "service_error"); }
  }, []);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  /** Runs one action, then reloads everything so every tab shows the stored result. */
  const run = useCallback(async (id: string, body: Record<string, unknown>, done?: string) => {
    setRunning(id); setNotice("");
    try { await call(body); await load(); if (done) setNotice(done); }
    catch (e) { setNotice(say(e instanceof Error ? e.message : "")); }
    finally { setRunning(null); }
  }, [load]);

  if (error && !data) return <div className={styles.suite}><p className={styles.alert} role="alert"><CircleAlert size={16} aria-hidden="true" />{say(error)}</p></div>;
  if (!data) return <div className={styles.suite}><p className={styles.loading}><Loader2 size={16} className={styles.spin} aria-hidden="true" />Loading search and AI visibility data…</p></div>;

  return <section className={styles.suite} aria-label="Search and AI visibility suite">
    <nav className={styles.tabs} aria-label="SEO Audit tools">{TABS.map(item => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}><item.icon size={15} aria-hidden="true" />{item.label}</button>)}</nav>
    {notice && <p className={styles.notice} role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss">×</button></p>}
    {tab === "dashboard" && <Dashboard data={data} go={setTab} run={run} running={running} />}
    {tab === "audit" && <SiteAudit data={data} run={run} running={running} />}
    {tab === "ranks" && <RankTracker data={data} run={run} running={running} />}
    {tab === "explorer" && <SiteExplorer data={data} run={run} running={running} />}
    {tab === "keywords" && <KeywordsExplorer data={data} run={run} running={running} />}
    {tab === "competitors" && <Competitors data={data} run={run} running={running} />}
    {tab === "ai" && <AiVisibility data={data} run={run} running={running} />}
  </section>;
}

type ToolProps = { data: Overview; run: (id: string, body: Record<string, unknown>, done?: string) => Promise<void>; running: string | null };

function RunButton({ id, running, onClick, icon: Icon = RefreshCw, children, disabled }: { id: string; running: string | null; onClick: () => void; icon?: LucideIcon; children: ReactNode; disabled?: boolean }) {
  const busy = running === id;
  return <button type="button" className={styles.primary} onClick={onClick} disabled={!!running || disabled} aria-busy={busy}>{busy ? <Loader2 size={15} className={styles.spin} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}{children}</button>;
}

function Stat({ label, value, note, tone, icon: Icon }: { label: string; value: string; note?: string; tone: string; icon: LucideIcon }) {
  return <div className={styles.stat} data-tone={tone}><span className={styles.statIcon}><Icon size={16} aria-hidden="true" /></span><span className={styles.statLabel}>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function Connect({ ok, title, children, problem, steps }: { ok: boolean; title: string; children: ReactNode; problem?: string | null; steps?: ReactNode[] }) {
  return <div className={styles.connect} data-ok={ok || undefined}>{ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}<div>
    <b>{title} {ok ? "connected" : "not connected"}</b><p>{children}</p>
    {!ok && problem && problem !== "search_console_not_configured" && problem !== "ahrefs_not_configured" && <p className={styles.connectProblem} role="status">{say(problem)}</p>}
    {!ok && steps && <ol className={styles.connectSteps}>{steps.map((step, i) => <li key={i}>{step}</li>)}</ol>}
  </div></div>;
}

/* Where each credential comes from. Values go in the server environment (Vercel → Settings → Environment Variables,
   and .env locally), never into this page. */
const SEARCH_CONSOLE_STEPS = [
  <>In Google Cloud Console, create a project, enable the <b>Google Search Console API</b>, then create a <b>service account</b> and a JSON key for it.</>,
  <>Set <code>GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL</code> to the key&apos;s <code>client_email</code> and <code>GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY</code> to its <code>private_key</code> (keep the <code>{"\\n"}</code> line breaks).</>,
  <>In Search Console, open the property for the whole site (best: the <b>Domain</b> property), go to Settings → Users and permissions and add the service-account email as a <b>Restricted</b> user.</>,
  <>Redeploy. The property is found automatically; set <code>GOOGLE_SEARCH_CONSOLE_PROPERTY</code> (e.g. <code>sc-domain:masterclassbuddy.com</code>) only to pick a different one.</>,
];
const AHREFS_STEPS = [
  <>In Ahrefs, open Account settings → <b>API keys</b> and create a key (API v3 access needs an Enterprise plan or API units).</>,
  <>Set <code>AHREFS_API_KEY</code> to that key in the server environment and redeploy.</>,
  <>Back here, press <b>Overview</b> on the Site explorer tab. Each report is saved, so viewing it again costs no units.</>,
];

function Table({ rows, columns, empty }: { rows: Row[]; columns: { key: string; label: string; render?: (row: Row) => ReactNode; numeric?: boolean }[]; empty: string }) {
  if (!rows.length) return <p className={styles.empty}>{empty}</p>;
  return <div className={styles.tableWrap}><table className={styles.table}>
    <thead><tr>{columns.map(c => <th key={c.key} scope="col" data-numeric={c.numeric || undefined}>{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i}>{columns.map(c => <td key={c.key} data-numeric={c.numeric || undefined}>{c.render ? c.render(row) : typeof row[c.key] === "number" ? n(row[c.key], 1) : String(row[c.key] ?? "—")}</td>)}</tr>)}</tbody>
  </table></div>;
}

/** A tiny trend line; lower is better for positions, so `invert` puts position 1 at the top. */
function Spark({ values, invert }: { values: number[]; invert?: boolean }) {
  if (values.length < 2) return <span className={styles.muted}>—</span>;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${invert ? ((v - min) / span) * 26 + 2 : 28 - ((v - min) / span) * 26}`).join(" ");
  return <svg className={styles.spark} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>;
}

function overviewOf(data: Overview, target: string) {
  const snap = data.snapshots.find(s => s.tool === "overview" && s.target === target);
  const d = snap?.data as { rating?: { domain_rating?: number; ahrefs_rank?: number }; backlinks?: { live?: number; live_refdomains?: number }; metrics?: { org_keywords?: number; org_traffic?: number; org_cost?: number; org_keywords_1_3?: number } } | undefined;
  return { snap, rating: d?.rating, backlinks: d?.backlinks, metrics: d?.metrics };
}

/* ───────── Dashboard ───────── */
function Dashboard({ data, go, run, running }: ToolProps & { go: (tab: Tab) => void }) {
  const own = overviewOf(data, data.domain);
  const latestChecks = latestPerPrompt(data);
  const cited = latestChecks.filter(c => c.cited).length, mentioned = latestChecks.filter(c => c.mentioned).length;
  const t = data.search?.totals;
  return <>
    <div className={styles.connections}>
      <Connect ok={data.connections.searchConsole} title="Google Search Console" problem={data.status.searchConsole.error} steps={SEARCH_CONSOLE_STEPS}>
        {data.connections.searchConsole ? <>Tracking <b>{data.status.searchConsole.property}</b>: Google queries, clicks, impressions and positions for {data.domain}.</> : <>Tracks how {data.domain} performs in Google Search: queries, clicks, impressions and positions.</>}
      </Connect>
      <Connect ok={data.connections.ahrefs} title="Ahrefs API" problem={data.status.ahrefs.error} steps={AHREFS_STEPS}>
        {data.connections.ahrefs
          ? <>Tracking {data.domain}: Domain Rating, backlinks, organic keywords and competitors.{data.status.ahrefs.unitsLeft != null && <> {n(data.status.ahrefs.unitsLeft)}{data.status.ahrefs.unitsLimit != null && <> of {n(data.status.ahrefs.unitsLimit)}</>} API units left{data.status.ahrefs.resetsOn && <>, resets {data.status.ahrefs.resetsOn}</>}.</>}</>
          : <>Tracks {data.domain}&apos;s Domain Rating, backlinks, organic keywords, competitors and keyword research.</>}
      </Connect>
      <Connect ok={data.connections.aiSearch} title="AI search">{data.connections.aiSearch ? "Tracked questions are asked to Perplexity; answers and citations are stored." : "Set PERPLEXITY_API_KEY to check whether AI answers name and cite the site."}</Connect>
    </div>
    <div className={styles.stats}>
      <Stat tone="mint" icon={ListChecks} label="Site health" value={data.lastAudit?.score == null ? "—" : `${data.lastAudit.score}%`} note={data.lastAudit ? `${n(data.lastAudit.pages_crawled)} pages · ${when(data.lastAudit.finished_at)}` : "Run the first site audit"} />
      <Stat tone="lavender" icon={Gauge} label="Domain Rating" value={n(own.rating?.domain_rating, 1)} note={own.snap ? `Ahrefs · ${when(own.snap.fetched_at)}` : "Ahrefs overview not fetched"} />
      <Stat tone="sky" icon={Link2} label="Referring domains" value={n(own.backlinks?.live_refdomains)} note={own.backlinks ? `${n(own.backlinks.live)} live backlinks` : "Ahrefs"} />
      <Stat tone="peach" icon={KeyRound} label="Organic keywords" value={n(own.metrics?.org_keywords)} note={own.metrics ? `${n(own.metrics.org_keywords_1_3)} in the top 3` : "Ahrefs"} />
      <Stat tone="butter" icon={TrendingUp} label="Organic traffic / month" value={n(own.metrics?.org_traffic)} note={own.metrics?.org_cost != null ? `worth $${n(own.metrics.org_cost / 100)}` : "Ahrefs estimate"} />
      <Stat tone="rose" icon={Search} label="Google clicks, 28 days" value={n(t?.clicks)} note={t ? `${n(t.impressions)} impressions · avg position ${n(t.position, 1)}` : "Search Console"} />
      <Stat tone="sage" icon={Target} label="Tracked keywords" value={n(data.keywords.length)} note={`${n(data.keywords.filter(k => (rankSeries(data, k.id).at(-1)?.position ?? 99) <= 10).length)} on page one`} />
      <Stat tone="lavender" icon={Bot} label="AI visibility" value={latestChecks.length ? `${Math.round((cited / latestChecks.length) * 100)}%` : "—"} note={latestChecks.length ? `cited in ${cited} of ${latestChecks.length} answers · named in ${mentioned}` : "Add questions to track"} />
    </div>
    <div className={styles.grid2}>
      <article className={styles.panel}>
        <h3><ListChecks size={16} aria-hidden="true" />Top issues to fix</h3>
        {data.lastAudit ? <IssueList audit={data.lastAudit} limit={6} /> : <p className={styles.empty}>No audit yet.</p>}
        <div className={styles.actions}><RunButton id="audit" running={running} onClick={() => void run("audit", { action: "audit" }, "Site audit finished.")} icon={ListChecks}>Run site audit</RunButton><button type="button" className={styles.link} onClick={() => go("audit")}>Open site audit</button></div>
      </article>
      <article className={styles.panel}>
        <h3><Sparkles size={16} aria-hidden="true" />Quick wins: striking-distance queries</h3>
        <p className={styles.hint}>Google already shows you at positions 8–20 for these. A better title, a section that answers the query and a few internal links can move them to page one.</p>
        <Table rows={strikingDistance(data).slice(0, 8) as unknown as Row[]} empty={data.connections.searchConsole ? "No queries between positions 8 and 20 in the last 28 days." : "Connect Search Console to see these."}
          columns={[{ key: "query", label: "Query" }, { key: "position", label: "Position", numeric: true }, { key: "impressions", label: "Impressions", numeric: true }, { key: "clicks", label: "Clicks", numeric: true }]} />
      </article>
    </div>
  </>;
}

const strikingDistance = (data: Overview) => (data.search?.queries ?? []).filter(q => q.position >= 8 && q.position <= 20).sort((a, b) => b.impressions - a.impressions)
  .map(q => ({ query: q.keys[0], position: Math.round(q.position * 10) / 10, impressions: q.impressions, clicks: q.clicks }));

/* ───────── Site audit ───────── */
function IssueList({ audit, limit }: { audit: Audit; limit?: number }) {
  const entries = Object.entries(audit.summary.byCode ?? {}).sort((a, b) => ({ error: 0, warning: 1, notice: 2 }[a[1].severity] - { error: 0, warning: 1, notice: 2 }[b[1].severity]) || b[1].pages - a[1].pages).slice(0, limit);
  if (!entries.length) return <p className={styles.empty}>No issues found. Every crawled page passed.</p>;
  return <ul className={styles.issues}>{entries.map(([code, issue]) => <li key={code} data-severity={issue.severity}><span className={styles.severity}>{issue.severity}</span><span>{ISSUE_LABELS[code] ?? issue.message}</span><b>{n(issue.pages)} {issue.pages === 1 ? "page" : "pages"}</b></li>)}</ul>;
}
const ISSUE_LABELS: Record<string, string> = {
  http_error: "Pages returning an error status", title_missing: "Missing <title>", title_short: "Title too short", title_long: "Title too long (over 60 characters)",
  description_missing: "Missing meta description", description_short: "Meta description too short", description_long: "Meta description too long",
  h1_missing: "Missing H1 heading", h1_multiple: "More than one H1", img_alt_missing: "Images without an alt attribute", img_alt_empty: "Images with an empty alt",
  thin_content: "Thin content (under 250 words)", canonical_missing: "No canonical link", noindex: "Pages marked noindex", slow_response: "Slow HTML response",
  broken_link: "Links to broken pages", duplicate_title: "Duplicate titles", duplicate_description: "Duplicate meta descriptions",
};

function SiteAudit({ data, run, running }: ToolProps) {
  const [filter, setFilter] = useState<"all" | Issue["severity"]>("all");
  const audit = data.lastAudit, s = audit?.summary;
  const pages = useMemo(() => data.auditPages.filter(p => filter === "all" ? p.issues.length : p.issues.some(i => i.severity === filter)), [data.auditPages, filter]);
  return <>
    <div className={styles.head}>
      <div><h2>Site audit</h2><p className={styles.hint}>Crawls up to 80 pages from {data.domain}/sitemap.xml, spread across every section, and checks titles, descriptions, headings, alt text, canonicals, indexing, speed, thin content, duplicates and broken internal links.</p></div>
      <RunButton id="audit" running={running} onClick={() => void run("audit", { action: "audit" }, "Site audit finished.")} icon={ListChecks}>{running === "audit" ? "Crawling…" : "Run new audit"}</RunButton>
    </div>
    {audit ? <>
      <div className={styles.auditTop}>
        <div className={styles.score} style={{ "--score": audit.score ?? 0 } as React.CSSProperties} role="img" aria-label={`Health score ${audit.score}%`}><b>{audit.score}%</b><small>Health score</small></div>
        <div className={styles.stats}>
          <Stat tone="rose" icon={CircleAlert} label="Errors" value={n(s?.errors)} note="fix first" />
          <Stat tone="butter" icon={TriangleAlert} label="Warnings" value={n(s?.warnings)} note="hurt rankings" />
          <Stat tone="sky" icon={Compass} label="Notices" value={n(s?.notices)} note="worth a look" />
          <Stat tone="mint" icon={CheckCircle2} label="Healthy pages" value={`${n(s?.healthy)} / ${n(audit.pages_crawled)}`} note={`avg HTML ${n(s?.avgMs)} ms`} />
          <Stat tone="lavender" icon={Link2} label="Broken links" value={n(s?.brokenLinks)} note={`${n(s?.linksChecked)} other internal links checked`} />
        </div>
      </div>
      <article className={styles.panel}><h3><ListChecks size={16} aria-hidden="true" />Issues by type</h3><IssueList audit={audit} /></article>
      <article className={styles.panel}>
        <h3><Globe2 size={16} aria-hidden="true" />Pages with issues<span className={styles.filters} role="group" aria-label="Severity">{(["all", "error", "warning", "notice"] as const).map(f => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</span></h3>
        {pages.length ? <ul className={styles.pages}>{pages.map(page => <li key={page.url}><details>
          <summary><code>{path(page.url)}</code><span className={styles.muted}>{page.status} · {n(page.load_ms)} ms · {n(page.word_count)} words</span><b>{page.issues.length} issue{page.issues.length === 1 ? "" : "s"}</b></summary>
          <dl className={styles.pageFacts}><div><dt>Title</dt><dd>{page.title ?? "—"}</dd></div><div><dt>Description</dt><dd>{page.description ?? "—"}</dd></div><div><dt>H1 · images · links</dt><dd>{page.h1_count} H1 · {page.images} images ({page.images_missing_alt} without alt) · {page.internal_links} internal links</dd></div></dl>
          <ul className={styles.pageIssues}>{page.issues.map((issue, i) => <li key={i} data-severity={issue.severity}><span className={styles.severity}>{issue.severity}</span>{issue.message}</li>)}</ul>
        </details></li>)}</ul> : <p className={styles.empty}>No pages with {filter === "all" ? "issues" : `${filter}s`}.</p>}
      </article>
      {data.audits.length > 1 && <article className={styles.panel}><h3><TrendingUp size={16} aria-hidden="true" />Audit history</h3>
        <Table rows={data.audits as unknown as Row[]} empty="" columns={[{ key: "started_at", label: "Started", render: r => when(String(r.started_at)) }, { key: "status", label: "Status" }, { key: "pages_crawled", label: "Pages", numeric: true }, { key: "issues_count", label: "Issues", numeric: true }, { key: "score", label: "Score", numeric: true, render: r => r.score == null ? "—" : `${r.score}%` }]} /></article>}
    </> : <p className={styles.empty}>No audit has run yet. Start one to see every page&rsquo;s SEO issues.</p>}
  </>;
}

/* ───────── Rank tracker ───────── */
const rankSeries = (data: Overview, id: number) => data.history.filter(h => h.keyword_id === id);

function RankTracker({ data, run, running }: ToolProps) {
  const [keyword, setKeyword] = useState(""), [country, setCountry] = useState("in");
  const add = (event: FormEvent) => { event.preventDefault(); if (keyword.trim()) void run("add-keyword", { action: "add-keyword", keyword, country }).then(() => setKeyword("")); };
  const rows = data.keywords.map(k => {
    const series = rankSeries(data, k.id), last = series.at(-1), weekAgo = series.at(-8);
    return { ...k, series, position: last?.position ?? null, change: last?.position != null && weekAgo?.position != null ? Math.round((weekAgo.position - last.position) * 10) / 10 : null,
      clicks: series.reduce((s, r) => s + r.clicks, 0), impressions: series.reduce((s, r) => s + r.impressions, 0), page: last?.page ?? null };
  });
  return <>
    <div className={styles.head}>
      <div><h2>Rank tracker</h2><p className={styles.hint}>Google&rsquo;s average position, clicks and impressions for each tracked keyword, day by day, from Search Console. Sync pulls the last 28 days; history builds up in Supabase.</p></div>
      <RunButton id="sync" running={running} disabled={!data.connections.searchConsole} onClick={() => void run("sync", { action: "sync-ranks" }, "Rankings synced from Search Console.")}>Sync rankings</RunButton>
    </div>
    <form className={styles.form} onSubmit={add}><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Keyword to track, e.g. langgraph tutorial" aria-label="Keyword" maxLength={120} />
      <input value={country} onChange={e => setCountry(e.target.value.toLowerCase().slice(0, 2))} aria-label="Country code" className={styles.short} />
      <button type="submit" className={styles.primary} disabled={!!running}><Plus size={15} aria-hidden="true" />Track</button></form>
    <article className={styles.panel}>
      <Table rows={rows as unknown as Row[]} empty="No keywords tracked yet. Add the searches you want to rank for."
        columns={[{ key: "keyword", label: "Keyword", render: r => <b>{String(r.keyword)}</b> },
          { key: "position", label: "Position", numeric: true, render: r => r.position == null ? <span className={styles.muted}>not ranking</span> : n(r.position, 1) },
          { key: "change", label: "7-day change", numeric: true, render: r => r.change == null ? "—" : <span className={styles.change} data-up={(r.change as number) > 0 || undefined} data-down={(r.change as number) < 0 || undefined}>{(r.change as number) > 0 ? <TrendingUp size={12} aria-hidden="true" /> : (r.change as number) < 0 ? <TrendingDown size={12} aria-hidden="true" /> : null}{(r.change as number) > 0 ? "+" : ""}{n(r.change, 1)}</span> },
          { key: "trend", label: "Trend", render: r => <Spark invert values={(r.series as Rank[]).map(s => s.position ?? 100)} /> },
          { key: "clicks", label: "Clicks", numeric: true }, { key: "impressions", label: "Impressions", numeric: true },
          { key: "page", label: "Ranking page", render: r => r.page ? <code>{path(String(r.page))}</code> : "—" },
          { key: "x", label: "", render: r => <button type="button" className={styles.iconButton} aria-label={`Stop tracking ${r.keyword}`} disabled={!!running} onClick={() => void run("rm", { action: "remove-keyword", id: r.id })}><Trash2 size={14} aria-hidden="true" /></button> }]} />
    </article>
    <div className={styles.grid2}>
      <article className={styles.panel}><h3><Search size={16} aria-hidden="true" />Top Google queries, 28 days</h3>
        <Table rows={(data.search?.queries ?? []).slice(0, 25).map(q => ({ query: q.keys[0], clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position }))} empty={data.connections.searchConsole ? (data.searchError ? say(data.searchError) : "No queries yet.") : "Connect Search Console."}
          columns={[{ key: "query", label: "Query", render: r => <button type="button" className={styles.link} disabled={!!running} onClick={() => void run("add-keyword", { action: "add-keyword", keyword: r.query, country: "in" }, `Tracking “${r.query}”.`)} title="Track this keyword">{String(r.query)}</button> }, { key: "clicks", label: "Clicks", numeric: true }, { key: "impressions", label: "Impr.", numeric: true }, { key: "ctr", label: "CTR", numeric: true, render: r => pct(r.ctr as number) }, { key: "position", label: "Pos.", numeric: true }]} /></article>
      <article className={styles.panel}><h3><Globe2 size={16} aria-hidden="true" />Top pages in Google, 28 days</h3>
        <Table rows={(data.search?.pages ?? []).slice(0, 25).map(p => ({ page: p.keys[0], clicks: p.clicks, impressions: p.impressions, position: p.position }))} empty={data.connections.searchConsole ? "No pages yet." : "Connect Search Console."}
          columns={[{ key: "page", label: "Page", render: r => <code>{path(String(r.page))}</code> }, { key: "clicks", label: "Clicks", numeric: true }, { key: "impressions", label: "Impr.", numeric: true }, { key: "position", label: "Pos.", numeric: true }]} /></article>
    </div>
  </>;
}

/* ───────── Site explorer (Ahrefs) ───────── */
function SiteExplorer({ data, run, running }: ToolProps) {
  const [target, setTarget] = useState(data.domain), [country, setCountry] = useState("in");
  const clean = target.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  const snap = (tool: string) => data.snapshots.find(s => s.tool === tool && s.target === clean);
  const own = overviewOf(data, clean);
  const fetchTool = (tool: string) => void run(`ahrefs-${tool}`, { action: "ahrefs", tool, target: clean, country }, "Ahrefs report saved.");
  const history = data.domainHistory.map(s => (s.data as { rating?: { domain_rating?: number } }).rating?.domain_rating).filter((v): v is number => typeof v === "number").reverse();
  return <>
    <div className={styles.head}><div><h2>Site explorer</h2><p className={styles.hint}>Any domain&rsquo;s backlink profile and organic search performance from the Ahrefs index. Each report is saved with its date, so you can come back to it without spending API units.</p></div></div>
    <div className={styles.form}><input value={target} onChange={e => setTarget(e.target.value)} aria-label="Domain to explore" placeholder="domain.com" /><input value={country} onChange={e => setCountry(e.target.value.toLowerCase().slice(0, 2))} aria-label="Country code" className={styles.short} />
      <RunButton id="ahrefs-overview" running={running} disabled={!data.connections.ahrefs} onClick={() => fetchTool("overview")} icon={Radar}>Overview</RunButton></div>
    {!data.connections.ahrefs && <p className={styles.alert}><KeyRound size={16} aria-hidden="true" />{say("ahrefs_not_configured")}</p>}
    <div className={styles.stats}>
      <Stat tone="lavender" icon={Gauge} label="Domain Rating" value={n(own.rating?.domain_rating, 1)} note={own.rating?.ahrefs_rank ? `Ahrefs Rank #${n(own.rating.ahrefs_rank)}` : own.snap ? when(own.snap.fetched_at) : "not fetched"} />
      <Stat tone="sky" icon={Link2} label="Backlinks" value={n(own.backlinks?.live)} note="live links" />
      <Stat tone="mint" icon={Globe2} label="Referring domains" value={n(own.backlinks?.live_refdomains)} note="unique sites linking" />
      <Stat tone="peach" icon={KeyRound} label="Organic keywords" value={n(own.metrics?.org_keywords)} note={`${n(own.metrics?.org_keywords_1_3)} in the top 3`} />
      <Stat tone="butter" icon={TrendingUp} label="Organic traffic" value={n(own.metrics?.org_traffic)} note={own.metrics?.org_cost != null ? `value $${n(own.metrics.org_cost / 100)}/mo` : "monthly estimate"} />
    </div>
    {clean === data.domain && history.length > 1 && <article className={styles.panel}><h3><TrendingUp size={16} aria-hidden="true" />Domain Rating over time</h3><div className={styles.bigSpark}><Spark values={history} /></div></article>}
    <ExplorerReport title="Referring domains" icon={Link2} tool="refdomains" snap={snap("refdomains")} onFetch={() => fetchTool("refdomains")} running={running} enabled={data.connections.ahrefs}
      columns={[{ key: "domain", label: "Domain" }, { key: "domain_rating", label: "DR", numeric: true }, { key: "dofollow_links", label: "Dofollow links", numeric: true }, { key: "links_to_target", label: "Links to target", numeric: true }, { key: "traffic_domain", label: "Their traffic", numeric: true }, { key: "first_seen", label: "First seen", render: r => String(r.first_seen ?? "").slice(0, 10) }]} />
    <ExplorerReport title="Organic keywords" icon={KeyRound} tool="organic-keywords" snap={snap("organic-keywords")} onFetch={() => fetchTool("organic-keywords")} running={running} enabled={data.connections.ahrefs}
      columns={[{ key: "keyword", label: "Keyword" }, { key: "volume", label: "Volume", numeric: true }, { key: "best_position", label: "Position", numeric: true }, { key: "keyword_difficulty", label: "KD", numeric: true }, { key: "sum_traffic", label: "Traffic", numeric: true }, { key: "best_position_url", label: "URL", render: r => r.best_position_url ? <code>{path(String(r.best_position_url))}</code> : "—" }]} />
    <ExplorerReport title="Top pages" icon={Globe2} tool="top-pages" snap={snap("top-pages")} onFetch={() => fetchTool("top-pages")} running={running} enabled={data.connections.ahrefs}
      columns={[{ key: "url", label: "Page", render: r => <code>{path(String(r.url))}</code> }, { key: "sum_traffic", label: "Traffic", numeric: true }, { key: "keywords", label: "Keywords", numeric: true }, { key: "top_keyword", label: "Top keyword" }, { key: "top_keyword_volume", label: "Its volume", numeric: true }]} />
  </>;
}

function ExplorerReport({ title, icon: Icon, tool, snap, onFetch, running, enabled, columns }: { title: string; icon: LucideIcon; tool: string; snap?: Snapshot; onFetch: () => void; running: string | null; enabled: boolean; columns: Parameters<typeof Table>[0]["columns"] }) {
  return <article className={styles.panel}>
    <h3><Icon size={16} aria-hidden="true" />{title}{snap && <span className={styles.muted}>saved {when(snap.fetched_at)}</span>}<span className={styles.grow} /><RunButton id={`ahrefs-${tool}`} running={running} disabled={!enabled} onClick={onFetch}>{snap ? "Refresh" : "Fetch"}</RunButton></h3>
    <Table rows={snap ? listOf(snap.data) : []} columns={columns} empty={snap ? "Ahrefs returned no rows." : "Not fetched yet."} />
  </article>;
}

/* ───────── Keywords explorer (Ahrefs) ───────── */
function KeywordsExplorer({ data, run, running }: ToolProps) {
  const [keywords, setKeywords] = useState(""), [country, setCountry] = useState("in");
  const ideas = data.snapshots.filter(s => s.tool === "matching-terms").slice(0, 1)[0], overview = data.snapshots.filter(s => s.tool === "keyword-overview").slice(0, 1)[0];
  const kd = (value: unknown) => typeof value === "number" ? <span className={styles.kd} data-level={value < 30 ? "easy" : value < 60 ? "medium" : "hard"}>{value}</span> : "—";
  const cols = [{ key: "keyword", label: "Keyword", render: (r: Row) => <b>{String(r.keyword)}</b> }, { key: "volume", label: "Volume", numeric: true }, { key: "difficulty", label: "KD", numeric: true, render: (r: Row) => kd(r.difficulty) },
    { key: "cpc", label: "CPC", numeric: true, render: (r: Row) => typeof r.cpc === "number" ? `$${(r.cpc / 100).toFixed(2)}` : "—" }, { key: "traffic_potential", label: "Traffic potential", numeric: true },
    { key: "track", label: "", render: (r: Row) => <button type="button" className={styles.iconButton} aria-label={`Track ${r.keyword}`} disabled={!!running} onClick={() => void run("add-keyword", { action: "add-keyword", keyword: r.keyword, country }, `Tracking “${r.keyword}”.`)}><Target size={14} aria-hidden="true" /></button> }];
  return <>
    <div className={styles.head}><div><h2>Keywords explorer</h2><p className={styles.hint}>Search volume, keyword difficulty, cost per click and traffic potential from Ahrefs. Ideas expand a seed keyword into the searches people actually make; track any of them in one click.</p></div></div>
    <div className={styles.form}><input value={keywords} onChange={e => setKeywords(e.target.value)} aria-label="Keywords, comma separated" placeholder="langgraph, agentic ai course, n8n tutorial" />
      <input value={country} onChange={e => setCountry(e.target.value.toLowerCase().slice(0, 2))} aria-label="Country code" className={styles.short} />
      <RunButton id="kw-overview" running={running} disabled={!data.connections.ahrefs || !keywords.trim()} onClick={() => void run("kw-overview", { action: "ahrefs", tool: "keyword-overview", keywords, country }, "Keyword metrics saved.")} icon={Search}>Analyse</RunButton>
      <RunButton id="kw-ideas" running={running} disabled={!data.connections.ahrefs || !keywords.trim()} onClick={() => void run("kw-ideas", { action: "ahrefs", tool: "matching-terms", keywords, country }, "Keyword ideas saved.")} icon={Sparkles}>Find ideas</RunButton></div>
    {!data.connections.ahrefs && <p className={styles.alert}><KeyRound size={16} aria-hidden="true" />{say("ahrefs_not_configured")}</p>}
    <article className={styles.panel}><h3><Search size={16} aria-hidden="true" />Keyword metrics{overview && <span className={styles.muted}>“{overview.target}” · {when(overview.fetched_at)}</span>}</h3><Table rows={overview ? listOf(overview.data) : []} columns={cols} empty="Analyse keywords to see their metrics." /></article>
    <article className={styles.panel}><h3><Sparkles size={16} aria-hidden="true" />Keyword ideas{ideas && <span className={styles.muted}>“{ideas.target}” · {when(ideas.fetched_at)}</span>}</h3><Table rows={ideas ? listOf(ideas.data) : []} columns={cols} empty="Find ideas for a seed keyword." /></article>
  </>;
}

/* ───────── Competitors ───────── */
function Competitors({ data, run, running }: ToolProps) {
  const [domain, setDomain] = useState("");
  const add = (event: FormEvent) => { event.preventDefault(); if (domain.trim()) void run("add-competitor", { action: "add-competitor", domain }).then(() => setDomain("")); };
  const suggested = data.snapshots.find(s => s.tool === "competitors" && s.target === data.domain);
  const rows = [{ id: 0, domain: data.domain }, ...data.competitors].map(c => { const o = overviewOf(data, c.domain); return { ...c, you: c.id === 0, dr: o.rating?.domain_rating, refdomains: o.backlinks?.live_refdomains, keywords: o.metrics?.org_keywords, traffic: o.metrics?.org_traffic, fetched: o.snap?.fetched_at }; });
  return <>
    <div className={styles.head}><div><h2>Competitors</h2><p className={styles.hint}>Compare your authority, keywords and traffic with the sites you compete with, and see which of them AI answers cite instead of you.</p></div>
      <RunButton id="ahrefs-competitors" running={running} disabled={!data.connections.ahrefs} onClick={() => void run("ahrefs-competitors", { action: "ahrefs", tool: "competitors", target: data.domain, country: "in" }, "Competitors found.")} icon={Swords}>Find competitors</RunButton></div>
    <form className={styles.form} onSubmit={add}><input value={domain} onChange={e => setDomain(e.target.value)} aria-label="Competitor domain" placeholder="competitor.com" /><button type="submit" className={styles.primary} disabled={!!running}><Plus size={15} aria-hidden="true" />Add competitor</button></form>
    <article className={styles.panel}><h3><Swords size={16} aria-hidden="true" />Head to head</h3>
      <Table rows={rows as unknown as Row[]} empty="" columns={[{ key: "domain", label: "Domain", render: r => <b>{String(r.domain)}{r.you ? " (you)" : ""}</b> }, { key: "dr", label: "DR", numeric: true }, { key: "refdomains", label: "Ref. domains", numeric: true }, { key: "keywords", label: "Keywords", numeric: true }, { key: "traffic", label: "Traffic", numeric: true },
        { key: "fetched", label: "Updated", render: r => r.fetched ? when(String(r.fetched)) : "—" },
        { key: "x", label: "", render: r => <span className={styles.rowActions}><button type="button" className={styles.iconButton} aria-label={`Fetch ${r.domain} overview`} disabled={!!running || !data.connections.ahrefs} onClick={() => void run(`ov-${r.domain}`, { action: "ahrefs", tool: "overview", target: r.domain, country: "in" })}>{running === `ov-${r.domain}` ? <Loader2 size={14} className={styles.spin} aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}</button>{!r.you && <button type="button" className={styles.iconButton} aria-label={`Remove ${r.domain}`} disabled={!!running} onClick={() => void run("rm", { action: "remove-competitor", id: r.id })}><Trash2 size={14} aria-hidden="true" /></button>}</span> }]} /></article>
    <article className={styles.panel}><h3><Radar size={16} aria-hidden="true" />Organic competitors found by Ahrefs{suggested && <span className={styles.muted}>{when(suggested.fetched_at)}</span>}</h3>
      <Table rows={suggested ? listOf(suggested.data) : []} empty={data.connections.ahrefs ? "Run “Find competitors”." : say("ahrefs_not_configured")}
        columns={[{ key: "competitor_domain", label: "Domain", render: r => <b>{String(r.competitor_domain)}</b> }, { key: "domain_rating", label: "DR", numeric: true }, { key: "keywords_common", label: "Shared keywords", numeric: true }, { key: "keywords_competitor", label: "Their extra keywords", numeric: true }, { key: "share", label: "Overlap", numeric: true, render: r => typeof r.share === "number" ? `${n(r.share, 1)}%` : "—" }, { key: "traffic", label: "Traffic", numeric: true },
          { key: "add", label: "", render: r => <button type="button" className={styles.iconButton} aria-label={`Watch ${r.competitor_domain}`} disabled={!!running} onClick={() => void run("add-competitor", { action: "add-competitor", domain: r.competitor_domain })}><Plus size={14} aria-hidden="true" /></button> }]} /></article>
  </>;
}

/* ───────── AI visibility ───────── */
const latestPerPrompt = (data: Overview) => data.prompts.map(p => data.checks.find(c => c.prompt_id === p.id)).filter((c): c is Check => !!c);

function AiVisibility({ data, run, running }: ToolProps) {
  const [prompt, setPrompt] = useState("");
  const add = (event: FormEvent) => { event.preventDefault(); if (prompt.trim()) void run("add-prompt", { action: "add-prompt", prompt }).then(() => setPrompt("")); };
  const latest = latestPerPrompt(data);
  const rivals = new Map<string, number>();
  for (const check of latest) for (const rival of check.competitors_cited) rivals.set(rival, (rivals.get(rival) ?? 0) + 1);
  const sources = new Map<string, number>();
  for (const check of latest) for (const c of check.citations) { try { const h = new URL(c.url).hostname.replace(/^www\./, ""); sources.set(h, (sources.get(h) ?? 0) + 1); } catch { /* not a URL */ } }
  return <>
    <div className={styles.head}><div><h2>AI visibility</h2><p className={styles.hint}>The questions your learners ask AI search. Each check asks Perplexity and records whether the answer names MasterClass Buddy and whether it cites {data.domain} as a source, and which sites it cites instead.</p></div>
      <RunButton id="ai" running={running} disabled={!data.connections.aiSearch || !data.prompts.length} onClick={() => void run("ai", { action: "ai-check" }, "AI answers checked.")} icon={Bot}>{running === "ai" ? "Asking AI search…" : "Check all questions"}</RunButton></div>
    <form className={styles.form} onSubmit={add}><input value={prompt} onChange={e => setPrompt(e.target.value)} aria-label="Question to track" placeholder="What is the best course to learn LangGraph in India?" maxLength={300} /><button type="submit" className={styles.primary} disabled={!!running}><Plus size={15} aria-hidden="true" />Add question</button></form>
    <div className={styles.stats}>
      <Stat tone="mint" icon={Link2} label="Cited as a source" value={latest.length ? `${latest.filter(c => c.cited).length} / ${latest.length}` : "—"} note="answers linking to the site" />
      <Stat tone="lavender" icon={Sparkles} label="Brand named" value={latest.length ? `${latest.filter(c => c.mentioned).length} / ${latest.length}` : "—"} note="answers naming MasterClass Buddy" />
      <Stat tone="rose" icon={Swords} label="Competitors cited" value={n([...rivals.values()].reduce((a, b) => a + b, 0))} note={[...rivals.keys()].slice(0, 3).join(", ") || "add competitors to watch"} />
    </div>
    <article className={styles.panel}><h3><Bot size={16} aria-hidden="true" />Tracked questions</h3>
      {data.prompts.length ? <ul className={styles.prompts}>{data.prompts.map(p => { const check = data.checks.find(c => c.prompt_id === p.id); return <li key={p.id}><details>
        <summary><b>{p.prompt}</b>{check ? <span className={styles.badges}><i data-ok={check.cited || undefined}>{check.cited ? `cited #${check.cited_rank}` : "not cited"}</i><i data-ok={check.mentioned || undefined}>{check.mentioned ? "named" : "not named"}</i><small>{when(check.checked_at)}</small></span> : <span className={styles.muted}>not checked yet</span>}
          <button type="button" className={styles.iconButton} aria-label={`Remove question ${p.prompt}`} disabled={!!running} onClick={e => { e.preventDefault(); void run("rm", { action: "remove-prompt", id: p.id }); }}><Trash2 size={14} aria-hidden="true" /></button></summary>
        {check && <div className={styles.answer}><p>{check.answer}</p>{check.citations.length > 0 && <ol>{check.citations.map((c, i) => <li key={i} data-own={c.url.includes(data.domain) || undefined}><ExternalLink size={11} aria-hidden="true" />{c.title || c.url}<small>{(() => { try { return new URL(c.url).hostname; } catch { return c.url; } })()}</small></li>)}</ol>}</div>}
      </details></li>; })}</ul> : <p className={styles.empty}>Add the questions people ask AI about what you teach.</p>}</article>
    {sources.size > 0 && <article className={styles.panel}><h3><Globe2 size={16} aria-hidden="true" />Sites AI search cites most</h3><p className={styles.hint}>Being linked from these, or matching the content they rank with, is the fastest way into AI answers.</p>
      <Table rows={[...sources].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([site, count]) => ({ site, count }))} empty="" columns={[{ key: "site", label: "Site", render: r => <b>{String(r.site)}{String(r.site).includes(data.domain) ? " (you)" : ""}</b> }, { key: "count", label: "Citations", numeric: true }]} /></article>}
  </>;
}
