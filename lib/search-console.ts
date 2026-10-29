export type SearchMetric = { clicks: number; impressions: number; ctr: number; position: number };
export type SearchRow = SearchMetric & { keys: string[] };
export type SearchConsoleReport = {
  status: "connected" | "not_configured";
  property: string;
  startDate: string;
  endDate: string;
  timezone: "America/Los_Angeles";
  generatedAt: string;
  totals: SearchMetric | null;
  daily: SearchRow[];
  queries: SearchRow[];
  pages: SearchRow[];
  countries: SearchRow[];
  devices: SearchRow[];
};

/** Search Console uses Pacific calendar dates, including daylight saving, not website report dates (IST). */
export function searchConsoleWindow(days: number, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const midnight = Date.parse(`${today}T00:00:00Z`);
  return { startDate: new Date(midnight - days * 86400_000).toISOString().slice(0, 10), endDate: new Date(midnight - 86400_000).toISOString().slice(0, 10) };
}
