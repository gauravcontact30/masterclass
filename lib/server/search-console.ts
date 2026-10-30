import "server-only";
import { JWT } from "google-auth-library";
import { z } from "zod";
import { HttpError } from "./http";
import { reportCache } from "./report-cache";
import { searchConsoleWindow, type SearchConsoleReport } from "../search-console";
import { siteUrl } from "../seo";

const API = "https://www.googleapis.com/webmasters/v3";
const cache = reportCache<SearchConsoleReport>(15 * 60_000);
const metric = z.object({ clicks: z.number().nonnegative(), impressions: z.number().nonnegative(), ctr: z.number().min(0).max(1), position: z.number().nonnegative(), keys: z.array(z.string()).default([]) });
const responseSchema = z.object({ rows: z.array(metric).default([]) });
const sitesSchema = z.object({ siteEntry: z.array(z.object({ siteUrl: z.string(), permissionLevel: z.string() })).default([]) });
let client: JWT | undefined;
let discovered: { property: string; expires: number } | undefined;

export const searchConsoleCredentials = () => Boolean(process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL && process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY);

/** A read-only token for the service account in GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / _PRIVATE_KEY, or null without them. */
async function accessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL, key = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  if (!email || !key) return null;
  // Vercel and .env keep the PEM on one line with literal \n; Google needs real line breaks.
  client ??= new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/webmasters.readonly"], transporterOptions: { timeout: 10_000, retry: false } });
  let token: string | null | undefined;
  try { token = (await client.getAccessToken()).token; } catch { throw new HttpError(502, "search_console_auth_failed"); }
  if (!token) throw new HttpError(502, "search_console_auth_failed");
  return token;
}

/**
 * The property to report on. GOOGLE_SEARCH_CONSOLE_PROPERTY wins when set; otherwise the properties the service account
 * can read are listed and the one covering the whole website is chosen: the Domain property (sc-domain:), then the
 * site's home URL-prefix property, then any URL-prefix property on the site (such as /tech-buzz alone).
 */
async function property(token: string): Promise<string> {
  const configured = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim();
  if (configured) return configured;
  if (discovered && discovered.expires > Date.now()) return discovered.property;
  const response = await fetch(`${API}/sites`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) })
    .catch(() => { throw new HttpError(502, "search_console_unavailable"); });
  if (!response.ok) throw new HttpError(502, response.status === 401 || response.status === 403 ? "search_console_auth_failed" : "search_console_unavailable");
  const sites = sitesSchema.safeParse(await response.json().catch(() => null));
  const readable = (sites.success ? sites.data.siteEntry : []).filter(site => site.permissionLevel !== "siteUnverifiedUser").map(site => site.siteUrl);
  const domain = siteUrl().hostname.replace(/^www\./, "");
  const onSite = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, "") === domain; } catch { return false; } };
  const home = (url: string) => { try { return new URL(url).pathname === "/"; } catch { return false; } };
  const chosen = readable.find(url => url === `sc-domain:${domain}`)
    ?? readable.find(url => onSite(url) && home(url))
    ?? readable.filter(onSite).sort((a, b) => a.length - b.length)[0];
  if (!chosen) throw new HttpError(403, "search_console_no_property");
  discovered = { property: chosen, expires: Date.now() + 60 * 60_000 };
  return chosen;
}

async function analytics(token: string, site: string, body: Record<string, unknown>) {
  const response = await fetch(`${API}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: "web", ...body }),
    cache: "no-store", signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new HttpError(502, "search_console_unavailable"); });
  if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502,
    response.status === 403 ? "search_console_access_denied" : response.status === 401 ? "search_console_auth_failed" : response.status === 429 ? "search_console_rate_limited" : "search_console_unavailable");
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new HttpError(502, "search_console_invalid_response");
  return parsed.data.rows;
}

/**
 * One raw searchAnalytics.query against the site's property (the SEO page's rank tracker asks about its own keywords
 * with dimension filters). Null when Search Console is not configured.
 */
export async function searchConsoleQuery(body: Record<string, unknown>): Promise<z.infer<typeof metric>[] | null> {
  const token = await accessToken();
  if (!token) return null;
  return analytics(token, await property(token), body);
}

/** Whether the credentials work and which property they report on, for the SEO page's connection card. */
export async function searchConsoleStatus(): Promise<{ connected: boolean; property: string | null; error: string | null }> {
  try {
    const token = await accessToken();
    if (!token) return { connected: false, property: null, error: "search_console_not_configured" };
    return { connected: true, property: await property(token), error: null };
  } catch (failure) {
    return { connected: false, property: null, error: failure instanceof HttpError ? failure.message : "search_console_unavailable" };
  }
}

export async function searchConsoleReport(days: number): Promise<SearchConsoleReport> {
  const window = searchConsoleWindow(days);
  const base = { property: process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim() || "", ...window, timezone: "America/Los_Angeles" as const, generatedAt: new Date().toISOString(), totals: null, daily: [], queries: [], pages: [], countries: [], devices: [] };
  const token = await accessToken();
  if (!token) return { ...base, status: "not_configured" };
  const site = await property(token);
  return cache.get(`${site}:${window.startDate}:${window.endDate}`, async () => {
    const query = (dimensions: string[], rowLimit: number) => analytics(token, site,
      { ...window, dataState: "final", dimensions, rowLimit, aggregationType: dimensions.includes("page") ? "byPage" : "byProperty" });
    // Never calculate totals by adding top queries/pages: privacy filtering and aggregation differ.
    const [totals, daily, queries, pages, countries, devices] = await Promise.all([
      query([], 1), query(["date"], 366), query(["query"], 100), query(["page"], 100), query(["country"], 250), query(["device"], 10),
    ]);
    return { ...base, property: site, status: "connected", generatedAt: new Date().toISOString(), totals: totals[0] ?? null,
      daily: daily.sort((a, b) => a.keys[0].localeCompare(b.keys[0])), queries, pages, countries, devices };
  });
}
