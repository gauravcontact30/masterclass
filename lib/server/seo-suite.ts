import "server-only";
import { db } from "./db";
import { adminError } from "./admin-rpc";
import { HttpError } from "./http";
import { searchConsoleCredentials, searchConsoleQuery, searchConsoleReport, searchConsoleStatus } from "./search-console";
import { reportCache } from "./report-cache";
import { searchConsoleWindow } from "../search-console";
import { siteUrl } from "../seo";

/*
 * The Super Admin "SEO Audit" page (components/super-admin-seo.tsx): everything a search and AI visibility suite needs,
 * stored in Supabase (migration 0049).
 *  - Site audit: crawls the site's own sitemap and checks every page for the problems search engines and audits flag.
 *  - Rank tracker: tracked keywords with Google's daily position, clicks and impressions from Search Console.
 *  - Site explorer, keywords explorer and competitors: the Ahrefs API v3 (AHREFS_API_KEY), every answer kept as history.
 *  - AI visibility: tracked questions asked to AI search (Perplexity), recording whether the brand is named or cited.
 * A site can only see its own pages and what these services report; nothing here reads anyone's browser history.
 */

const AHREFS = "https://api.ahrefs.com/v3";
const BRAND = [/master\s?class\s?buddy/i, /masterclassbuddy/i];
const today = () => new Date().toISOString().slice(0, 10);
const host = (value: string) => { try { return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
export const ownDomain = () => host(siteUrl().href);

export const ahrefsConfigured = () => Boolean(process.env.AHREFS_API_KEY);
export const searchConsoleConfigured = searchConsoleCredentials;
export const aiSearchConfigured = () => Boolean(process.env.PERPLEXITY_API_KEY);

/* ───────────────────────── Ahrefs API ───────────────────────── */

export type AhrefsTool = "overview" | "refdomains" | "organic-keywords" | "top-pages" | "competitors" | "keyword-overview" | "matching-terms";

async function ahrefsGet(path: string, params: Record<string, string | number | undefined>) {
  const key = process.env.AHREFS_API_KEY;
  if (!key) throw new HttpError(503, "ahrefs_not_configured");
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)]));
  let response: Response;
  try {
    response = await fetch(`${AHREFS}${path}?${query}`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  } catch { throw new HttpError(502, "ahrefs_unavailable"); }
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    console.error(JSON.stringify({ event: "ahrefs_error", path, status: response.status, detail: String((body as { error?: unknown } | null)?.error ?? "").slice(0, 200) }));
    throw new HttpError(response.status === 429 ? 429 : 502,
      response.status === 429 ? "ahrefs_rate_limited" : response.status === 401 || response.status === 403 ? "ahrefs_auth_failed" : "ahrefs_unavailable");
  }
  // Each endpoint wraps its answer in one key (domain_rating, metrics, keywords, refdomains…): return what is inside.
  const values = body ? Object.values(body) : [];
  return values.length === 1 ? values[0] : body;
}

export type AhrefsStatus = { connected: boolean; error: string | null; plan: string | null; unitsLeft: number | null; unitsLimit: number | null; resetsOn: string | null };
const ahrefsStatusCache = reportCache<AhrefsStatus>(10 * 60_000, 2);

/**
 * Whether the key works, and the API units left this period, for the connection card. Ahrefs' limits-and-usage
 * endpoint costs no units; the answer is cached for ten minutes. Field names are read defensively.
 */
export function ahrefsStatus(): Promise<AhrefsStatus> {
  const empty = { plan: null, unitsLeft: null, unitsLimit: null, resetsOn: null };
  if (!ahrefsConfigured()) return Promise.resolve({ connected: false, error: "ahrefs_not_configured", ...empty });
  return ahrefsStatusCache.get("status", async () => {
    try {
      const raw = await ahrefsGet("/subscription-info/limits-and-usage", {}) as Record<string, unknown> | null;
      const num = (key: string) => typeof raw?.[key] === "number" ? raw[key] as number : null;
      // A key can carry its own limit; otherwise it shares the workspace's.
      const limit = num("units_limit_api_key") ?? num("units_limit_workspace"), used = num("units_usage_api_key") ?? num("units_usage_workspace");
      return { connected: true, error: null, plan: typeof raw?.subscription === "string" ? raw.subscription : null,
        unitsLimit: limit, unitsLeft: limit != null && used != null ? Math.max(0, limit - used) : null,
        resetsOn: typeof raw?.usage_reset_date === "string" ? raw.usage_reset_date.slice(0, 10) : null };
    } catch (failure) {
      return { connected: false, error: failure instanceof HttpError ? failure.message : "ahrefs_unavailable", ...empty };
    }
  });
}

/** One Ahrefs report, fetched and stored as a snapshot (the page shows the latest one without paying again). */
export async function runAhrefs(tool: AhrefsTool, input: { target?: string; keywords?: string; country?: string }) {
  const target = host(input.target || ownDomain()), country = (input.country || "in").toLowerCase(), date = today();
  let data: unknown;
  switch (tool) {
    case "overview": {
      const [rating, backlinks, metrics] = await Promise.all([
        ahrefsGet("/site-explorer/domain-rating", { target, date }),
        ahrefsGet("/site-explorer/backlinks-stats", { target, date, mode: "subdomains" }),
        ahrefsGet("/site-explorer/metrics", { target, date, mode: "subdomains", country }),
      ]);
      data = { rating, backlinks, metrics };
      break;
    }
    case "refdomains":
      data = await ahrefsGet("/site-explorer/refdomains", { target, mode: "subdomains", select: "domain,domain_rating,dofollow_links,links_to_target,traffic_domain,first_seen", order_by: "domain_rating:desc", limit: 50 });
      break;
    case "organic-keywords":
      data = await ahrefsGet("/site-explorer/organic-keywords", { target, date, country, mode: "subdomains", select: "keyword,volume,best_position,best_position_url,sum_traffic,keyword_difficulty", order_by: "sum_traffic:desc", limit: 100 });
      break;
    case "top-pages":
      data = await ahrefsGet("/site-explorer/top-pages", { target, date, country, mode: "subdomains", select: "url,sum_traffic,keywords,top_keyword,top_keyword_volume,value", order_by: "sum_traffic:desc", limit: 50 });
      break;
    case "competitors":
      data = await ahrefsGet("/site-explorer/organic-competitors", { target, date, country, mode: "subdomains", select: "competitor_domain,domain_rating,keywords_common,keywords_competitor,share,traffic", order_by: "keywords_common:desc", limit: 25 });
      break;
    case "keyword-overview":
    case "matching-terms": {
      const keywords = (input.keywords ?? "").split(",").map(k => k.trim()).filter(Boolean).slice(0, tool === "keyword-overview" ? 50 : 5).join(",");
      if (!keywords) throw new HttpError(400, "keywords_required");
      data = await ahrefsGet(`/keywords-explorer/${tool === "keyword-overview" ? "overview" : "matching-terms"}`, tool === "keyword-overview"
        ? { keywords, country, select: "keyword,volume,difficulty,cpc,traffic_potential,global_volume,parent_topic" }
        : { keywords, country, select: "keyword,volume,difficulty,cpc,traffic_potential", order_by: "volume:desc", limit: 100 });
      break;
    }
  }
  const snapshotTarget = tool === "keyword-overview" || tool === "matching-terms" ? (input.keywords ?? "").toLowerCase().slice(0, 200) : target;
  const { data: row, error } = await db().from("seo_ahrefs_snapshots").insert({ tool, target: snapshotTarget, params: { country }, data }).select("id,tool,target,params,data,fetched_at").single();
  if (error) adminError(error);
  return row;
}

/* ───────────────────────── Site audit ───────────────────────── */

type Severity = "error" | "warning" | "notice";
type Issue = { code: string; severity: Severity; message: string };
const MAX_PAGES = 80;

const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.slice(2).find(v => v !== undefined) ?? null;
const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

async function sitemapUrls(origin: string) {
  const seen = new Set<string>(), queue = [`${origin}/sitemap.xml`], pages: string[] = [];
  while (queue.length && pages.length < MAX_PAGES * 3) {
    const at = queue.shift()!;
    if (seen.has(at)) continue;
    seen.add(at);
    const xml = await fetch(at, { cache: "no-store", signal: AbortSignal.timeout(20_000) }).then(r => r.ok ? r.text() : "").catch(() => "");
    for (const [, loc] of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) (/<sitemapindex/i.test(xml) ? queue : pages).push(decode(loc));
  }
  // Spread the budget across sections instead of the first 80 URLs of one long list.
  const bySection = new Map<string, string[]>();
  for (const url of new Set(pages)) { const section = new URL(url).pathname.split("/")[1] ?? ""; (bySection.get(section) ?? bySection.set(section, []).get(section)!).push(url); }
  const picked: string[] = [], lists = [...bySection.values()];
  for (let i = 0; picked.length < MAX_PAGES && lists.some(list => list.length > i); i++) for (const list of lists) if (list[i] && picked.length < MAX_PAGES) picked.push(list[i]);
  return picked.length ? picked : [`${origin}/`];
}

function inspect(url: string, status: number, ms: number, html: string, origin: string) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? html;
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]) : null;
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const description = metas.map(tag => attr(tag, "name")?.toLowerCase() === "description" ? attr(tag, "content") : null).find(v => v != null);
  const robots = metas.map(tag => attr(tag, "name")?.toLowerCase() === "robots" ? attr(tag, "content") : null).find(v => v != null) ?? "";
  const canonical = [...head.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(tag => attr(tag, "rel")?.toLowerCase() === "canonical");
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const h1 = (body.match(/<h1\b/gi) ?? []).length;
  const images = [...body.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const missingAlt = images.filter(tag => attr(tag, "alt") === null).length, emptyAlt = images.filter(tag => attr(tag, "alt") === "" && !/aria-hidden="true"/.test(tag)).length;
  const words = text(body.match(/<main[\s\S]*<\/main>/i)?.[0] ?? body).split(" ").filter(w => /[a-z0-9]/i.test(w)).length;
  const links = new Set<string>();
  for (const [, href] of body.matchAll(/<a\b[^>]*\bhref="([^"#]+)/gi)) {
    try { const target = new URL(decode(href), url); if (target.origin === origin) links.add(`${target.origin}${target.pathname}`); } catch { /* not a URL */ }
  }
  const issues: Issue[] = [];
  const add = (code: string, severity: Severity, message: string) => issues.push({ code, severity, message });
  if (status >= 400) add("http_error", "error", `The page answers HTTP ${status}.`);
  if (!title) add("title_missing", "error", "No <title>: search results have nothing to show.");
  else if (title.length < 30) add("title_short", "warning", `Title is ${title.length} characters; aim for 30–60 with the main keyword first.`);
  else if (title.length > 60) add("title_long", "warning", `Title is ${title.length} characters; Google cuts it after about 60.`);
  if (!description) add("description_missing", "error", "No meta description: Google writes its own snippet.");
  else if (description.length < 70) add("description_short", "warning", `Meta description is ${description.length} characters; aim for 70–160.`);
  else if (description.length > 160) add("description_long", "warning", `Meta description is ${description.length} characters; Google cuts it after about 160.`);
  if (h1 === 0) add("h1_missing", "error", "No H1 heading: the page's topic is unclear to search engines.");
  if (h1 > 1) add("h1_multiple", "warning", `${h1} H1 headings; use one per page.`);
  if (missingAlt) add("img_alt_missing", "warning", `${missingAlt} image${missingAlt === 1 ? " has" : "s have"} no alt attribute.`);
  if (emptyAlt) add("img_alt_empty", "notice", `${emptyAlt} image${emptyAlt === 1 ? " has" : "s have"} an empty alt; fine for decoration, describe content images.`);
  if (status < 400 && words < 250) add("thin_content", "notice", `Only ${words} words of visible text; thin pages rarely rank.`);
  if (!canonical) add("canonical_missing", "notice", "No canonical link: duplicate URLs can split ranking signals.");
  if (/noindex/i.test(robots)) add("noindex", "warning", "Marked noindex: Google will drop it from search.");
  if (ms > 1800) add("slow_response", "warning", `The HTML took ${(ms / 1000).toFixed(1)} s to arrive; aim for under 0.8 s.`);
  return { row: { url, status, load_ms: ms, title, description: description ?? null, h1_count: h1, word_count: words, images: images.length, images_missing_alt: missingAlt, canonical: canonical ? attr(canonical, "href") : null, noindex: /noindex/i.test(robots), internal_links: links.size, issues }, links };
}

async function pool<T, R>(items: T[], size: number, work: (item: T) => Promise<R>) {
  const out: R[] = []; let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => { while (next < items.length) { const at = next++; out[at] = await work(items[at]); } }));
  return out;
}

/** Crawls up to MAX_PAGES sitemap pages and checks each one and every internal link they point to; stores nothing. */
export async function crawlSite(origin: string) {
    const urls = await sitemapUrls(origin);
    const results = await pool(urls, 5, async url => {
      const started = Date.now();
      try {
        const response = await fetch(url, { cache: "no-store", redirect: "follow", headers: { "User-Agent": "MasterClassBuddy-SiteAudit/1.0", Accept: "text/html" }, signal: AbortSignal.timeout(20_000) });
        const html = response.headers.get("content-type")?.includes("html") ? await response.text() : "";
        return inspect(url, response.status, Date.now() - started, html, origin);
      } catch { return inspect(url, 599, Date.now() - started, "", origin); }
    });
    // Internal links to pages outside the crawl are checked too, so broken links anywhere on the crawled pages show up.
    const crawled = new Set(urls.map(u => { const p = new URL(u); return `${p.origin}${p.pathname}`; }));
    const others = [...new Set(results.flatMap(r => [...r.links]))].filter(link => !crawled.has(link)).slice(0, 150);
    const broken = new Set<string>();
    await pool(others, 6, async link => {
      const status = await fetch(link, { method: "HEAD", cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(15_000) }).then(r => r.status === 405 ? fetch(link, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).then(g => g.status) : r.status).catch(() => 599);
      if (status >= 400 && status !== 401 && status !== 403) broken.add(link);
    });
    for (const result of results) for (const target of [...result.links].filter(link => broken.has(link)).slice(0, 5)) result.row.issues.push({ code: "broken_link", severity: "error", message: `Links to a broken page: ${new URL(target).pathname}` });
    // The same title or description on several pages makes them compete with each other.
    for (const field of ["title", "description"] as const) {
      const groups = new Map<string, number>();
      for (const r of results) if (r.row[field]) groups.set(r.row[field]!, (groups.get(r.row[field]!) ?? 0) + 1);
      for (const r of results) { const count = r.row[field] ? groups.get(r.row[field]!) ?? 0 : 0; if (count > 1) r.row.issues.push({ code: `duplicate_${field}`, severity: "warning", message: `The same ${field} is used on ${count} pages.` }); }
    }
    const rows = results.map(r => r.row);
    const tally = (severity: Severity) => rows.reduce((sum, row) => sum + row.issues.filter(issue => issue.severity === severity).length, 0);
    const errors = tally("error"), warnings = tally("warning"), notices = tally("notice");
    const healthy = rows.filter(row => !row.issues.some(issue => issue.severity === "error")).length;
    // Health score: the share of pages without errors, docked for warnings (the way site-audit tools grade a crawl).
    const score = Math.max(0, Math.min(100, Math.round((healthy / Math.max(1, rows.length)) * 100 - (warnings / Math.max(1, rows.length)) * 4)));
    const byCode: Record<string, { severity: Severity; pages: number; message: string }> = {};
    for (const row of rows) for (const issue of row.issues) { const entry = byCode[issue.code] ??= { severity: issue.severity, pages: 0, message: issue.message }; entry.pages++; }
    const avgMs = Math.round(rows.reduce((s, r) => s + (r.load_ms ?? 0), 0) / Math.max(1, rows.length));
    return { rows, score, summary: { errors, warnings, notices, healthy, brokenLinks: broken.size, linksChecked: others.length, avgMs, byCode } };
}

/** Runs crawlSite on the live site and stores the audit with every page it checked. */
export async function runSiteAudit() {
  const { data: audit, error } = await db().from("seo_audits").insert({ status: "running" }).select("id").single();
  if (error) adminError(error);
  try {
    const { rows, score, summary } = await crawlSite(siteUrl().origin);
    for (let i = 0; i < rows.length; i += 50) {
      const { error: insertError } = await db().from("seo_audit_pages").insert(rows.slice(i, i + 50).map(row => ({ ...row, audit_id: audit.id })));
      if (insertError) adminError(insertError);
    }
    await db().from("seo_audits").update({ status: "done", finished_at: new Date().toISOString(), pages_crawled: rows.length, issues_count: summary.errors + summary.warnings + summary.notices, score, summary }).eq("id", audit.id);
    return audit.id as number;
  } catch (failure) {
    await db().from("seo_audits").update({ status: "failed", finished_at: new Date().toISOString(), error: String(failure).slice(0, 300) }).eq("id", audit.id);
    throw failure;
  }
}

/* ───────────────────────── Rank tracker (Search Console) ───────────────────────── */

/** Pulls the last 28 days of Google position, clicks and impressions for every tracked keyword into seo_rank_history. */
export async function syncRanks() {
  if (!searchConsoleConfigured()) throw new HttpError(503, "search_console_not_configured");
  const { data: keywords, error } = await db().from("seo_keywords").select("id,keyword");
  if (error) adminError(error);
  const window = searchConsoleWindow(28);
  let days = 0;
  await pool(keywords ?? [], 3, async ({ id, keyword }) => {
    const filter = { dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "equals", expression: keyword }] }] };
    const [daily, pages] = await Promise.all([
      searchConsoleQuery({ ...window, dimensions: ["date"], rowLimit: 30, ...filter }),
      searchConsoleQuery({ ...window, dimensions: ["page"], rowLimit: 1, ...filter }),
    ]);
    const rows = (daily ?? []).map(row => ({ keyword_id: id, day: row.keys[0], position: Math.round(row.position * 100) / 100, clicks: Math.round(row.clicks), impressions: Math.round(row.impressions), ctr: row.ctr, page: pages?.[0]?.keys[0] ?? null }));
    if (rows.length) { const { error: upsertError } = await db().from("seo_rank_history").upsert(rows, { onConflict: "keyword_id,day" }); if (upsertError) adminError(upsertError); }
    days += rows.length;
  });
  return { keywords: keywords?.length ?? 0, days };
}

/* ───────────────────────── AI visibility (Perplexity) ───────────────────────── */

/** Asks AI search every tracked question (one at a time: Perplexity allows only a few concurrent calls). */
export async function runAiChecks() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new HttpError(503, "ai_search_not_configured");
  const [{ data: prompts, error }, { data: competitors }] = await Promise.all([
    db().from("seo_ai_prompts").select("id,prompt").order("id").limit(15),
    db().from("seo_competitors").select("domain"),
  ]);
  if (error) adminError(error);
  const mine = ownDomain(), rivals = (competitors ?? []).map(c => host(c.domain)).filter(Boolean);
  let checked = 0;
  for (const { id, prompt } of prompts ?? []) {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: prompt }], max_tokens: 700 }), signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (!response?.ok) { if (response?.status === 429) break; continue; }
    const body = await response.json().catch(() => null) as { choices?: { message?: { content?: string } }[]; search_results?: { url?: string; title?: string }[]; citations?: string[] } | null;
    const answer = body?.choices?.[0]?.message?.content ?? "";
    const citations = (body?.search_results?.length ? body.search_results : (body?.citations ?? []).map(url => ({ url, title: "" }))).map(c => ({ url: c.url ?? "", title: c.title ?? "" })).slice(0, 20);
    const hosts = citations.map(c => host(c.url));
    const rank = hosts.findIndex(h => h === mine || h.endsWith(`.${mine}`));
    const { error: insertError } = await db().from("seo_ai_checks").insert({ prompt_id: id, engine: "perplexity", mentioned: BRAND.some(re => re.test(answer)), cited: rank >= 0, cited_rank: rank >= 0 ? rank + 1 : null,
      competitors_cited: [...new Set(hosts.filter(h => rivals.some(r => h === r || h.endsWith(`.${r}`))))], answer: answer.slice(0, 4000), citations });
    if (insertError) adminError(insertError);
    checked++;
  }
  return { checked };
}

/* ───────────────────────── Everything the page shows ───────────────────────── */

const latest = <T extends { fetched_at: string; tool: string; target: string }>(rows: T[]) => {
  const out = new Map<string, T>();
  for (const row of rows) { const key = `${row.tool}|${row.target}`; if (!out.has(key)) out.set(key, row); }
  return [...out.values()];
};

export async function seoOverview() {
  const client = db();
  const [audits, keywords, history, snapshots, competitors, prompts, checks] = await Promise.all([
    client.from("seo_audits").select("*").order("id", { ascending: false }).limit(12),
    client.from("seo_keywords").select("*").order("created_at"),
    client.from("seo_rank_history").select("keyword_id,day,position,clicks,impressions,ctr,page").gte("day", new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10)).order("day"),
    client.from("seo_ahrefs_snapshots").select("id,tool,target,params,data,fetched_at").order("fetched_at", { ascending: false }).limit(200),
    client.from("seo_competitors").select("*").order("created_at"),
    client.from("seo_ai_prompts").select("*").order("created_at"),
    client.from("seo_ai_checks").select("id,prompt_id,checked_at,engine,mentioned,cited,cited_rank,competitors_cited,answer,citations").order("checked_at", { ascending: false }).limit(300),
  ]);
  for (const result of [audits, keywords, history, snapshots, competitors, prompts, checks]) if (result.error) adminError(result.error);
  const lastAudit = audits.data?.find(a => a.status === "done") ?? null;
  const pages = lastAudit ? await client.from("seo_audit_pages").select("url,status,load_ms,title,description,h1_count,word_count,images,images_missing_alt,canonical,noindex,internal_links,issues").eq("audit_id", lastAudit.id).order("url") : { data: [] };
  // Search Console totals, top queries and pages for the last 28 days; striking-distance queries (positions 8–20) are the cheapest wins.
  let search: Awaited<ReturnType<typeof searchConsoleReport>> | null = null, searchError: string | null = null;
  const [, gsc, ahrefs] = await Promise.all([
    searchConsoleReport(28).then(report => { search = report; }, failure => { searchError = failure instanceof HttpError ? failure.message : "search_console_unavailable"; }),
    searchConsoleStatus(), ahrefsStatus(),
  ]);
  return {
    generatedAt: new Date().toISOString(), domain: ownDomain(),
    // A service is "connected" once its credentials actually work, not merely once they are set.
    connections: { ahrefs: ahrefs.connected, searchConsole: gsc.connected, aiSearch: aiSearchConfigured() },
    status: { searchConsole: gsc, ahrefs },
    audits: audits.data ?? [], lastAudit, auditPages: pages.data ?? [],
    keywords: keywords.data ?? [], history: history.data ?? [],
    snapshots: latest(snapshots.data ?? []), domainHistory: (snapshots.data ?? []).filter(s => s.tool === "overview" && s.target === ownDomain()).slice(0, 30),
    competitors: competitors.data ?? [], prompts: prompts.data ?? [], checks: checks.data ?? [],
    search, searchError,
  };
}
