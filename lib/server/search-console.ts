import "server-only";
import { JWT } from "google-auth-library";
import { z } from "zod";
import { HttpError } from "./http";
import { reportCache } from "./report-cache";
import { searchConsoleWindow, type SearchConsoleReport } from "../search-console";

// This is the URL-prefix property supplied by the site owner. Override with the exact verified property ID.
export const DEFAULT_SEARCH_PROPERTY = "https://www.masterclassbuddy.com/tech-buzz";
const cache = reportCache<SearchConsoleReport>(15 * 60_000);
const metric = z.object({ clicks: z.number().nonnegative(), impressions: z.number().nonnegative(), ctr: z.number().min(0).max(1), position: z.number().nonnegative(), keys: z.array(z.string()).default([]) });
const responseSchema = z.object({ rows: z.array(metric).default([]) });
let client: JWT | undefined;

/**
 * One raw searchAnalytics.query against the configured property (the Ahrefs page's rank tracker asks about its own
 * keywords with dimension filters). Null when Search Console is not configured.
 */
export async function searchConsoleQuery(body: Record<string, unknown>): Promise<z.infer<typeof metric>[] | null> {
  const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim() || DEFAULT_SEARCH_PROPERTY;
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL, key = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  if (!email || !key) return null;
  client ??= new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/webmasters.readonly"], transporterOptions: { timeout: 10_000, retry: false } });
  let token: string | null | undefined;
  try { token = (await client.getAccessToken()).token; } catch { throw new HttpError(502, "search_console_auth_failed"); }
  if (!token) throw new HttpError(502, "search_console_auth_failed");
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: "web", ...body }),
    cache: "no-store", signal: AbortSignal.timeout(15_000),
  }).catch(() => { throw new HttpError(502, "search_console_unavailable"); });
  if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502, response.status === 403 ? "search_console_access_denied" : response.status === 429 ? "search_console_rate_limited" : "search_console_unavailable");
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new HttpError(502, "search_console_invalid_response");
  return parsed.data.rows;
}

export async function searchConsoleReport(days: number): Promise<SearchConsoleReport> {
  const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim() || DEFAULT_SEARCH_PROPERTY;
  const email = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY;
  const window = searchConsoleWindow(days);
  const base = { property, ...window, timezone: "America/Los_Angeles" as const, generatedAt: new Date().toISOString(), totals: null, daily: [], queries: [], pages: [], countries: [], devices: [] };
  if (!email || !key) return { ...base, status: "not_configured" };
  return cache.get(`${property}:${window.startDate}:${window.endDate}`, async () => {
    client ??= new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/webmasters.readonly"], transporterOptions: { timeout: 10_000, retry: false } });
    let token: string | null | undefined;
    try { token = (await client.getAccessToken()).token; } catch { throw new HttpError(502, "search_console_auth_failed"); }
    if (!token) throw new HttpError(502, "search_console_auth_failed");
    async function query(dimensions: string[], rowLimit: number) {
      let response: Response;
      try {
        response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
          method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...window, type: "web", dataState: "final", dimensions, rowLimit, aggregationType: dimensions.includes("page") ? "byPage" : "byProperty" }),
          cache: "no-store", signal: AbortSignal.timeout(15_000),
        });
      } catch { throw new HttpError(502, "search_console_unavailable"); }
      if (!response.ok) throw new HttpError(response.status === 429 ? 429 : 502,
        response.status === 403 ? "search_console_access_denied" : response.status === 401 ? "search_console_auth_failed" : response.status === 429 ? "search_console_rate_limited" : "search_console_unavailable");
      const parsed = responseSchema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) throw new HttpError(502, "search_console_invalid_response");
      return parsed.data.rows;
    }
    // Never calculate totals by adding top queries/pages: privacy filtering and aggregation differ.
    const [totals, daily, queries, pages, countries, devices] = await Promise.all([
      query([], 1), query(["date"], 366), query(["query"], 100), query(["page"], 100), query(["country"], 250), query(["device"], 10),
    ]);
    return { ...base, status: "connected", generatedAt: new Date().toISOString(), totals: totals[0] ?? null,
      daily: daily.sort((a, b) => a.keys[0].localeCompare(b.keys[0])), queries, pages, countries, devices };
  });
}
