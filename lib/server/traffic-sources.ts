import { db } from "./db";
import { adminError } from "./admin-rpc";
import { siteUrl } from "@/lib/seo";
import { isAudience, SIGNAL_COLUMNS, type VisitSignals } from "@/lib/visit-quality";
import { LIVE_MS } from "@/lib/live-visits";
import { SOCIAL_SOURCES, SOURCE_LABEL, classifySource, type SourceId } from "@/lib/traffic-sources";

/*
 * Super Admin → Traffic sources (components/super-admin-traffic-sources.tsx). Every figure comes from stored beacons:
 * a session's source is read from its first page view (campaign tag, else referrer, else Direct; lib/traffic-sources.ts),
 * and "live now" is a session whose page heartbeat (site_presence) arrived within LIVE_MS while the tab was visible:
 * the same rule as the Overview's live stream. Automated browsers and the site's own machine are dropped per session
 * (lib/visit-quality.ts), as in every other activity report.
 */
type View = VisitSignals & {
  created_at: string; visitor_id: string; session_id: string; user_id: string | null; path: string;
  referrer_host: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  country: string | null; city: string | null; device: string | null;
};
type Presence = { session_id: string; path: string; started_at: string; seen_at: string };
const COLUMNS = `created_at,visitor_id,session_id,user_id,path,referrer_host,utm_source,utm_medium,utm_campaign,country,city,device,${SIGNAL_COLUMNS}`;
const PAGE = 1000, CAP = 40_000;

export type SourceSession = { source: SourceId; label: string; referrer: string | null; campaign: string | null; landing: string; path: string; country: string | null; city: string | null; device: string | null; signedIn: boolean; startedAt: string; seenAt: string; views: number };
export type SourceRow = { id: SourceId; label: string; sessions: number; visitors: number; views: number; signedIn: number; live: number };
export type TrafficSourcesReport = {
  generatedAt: string; liveSeconds: number; days: number; capped: boolean;
  live: { total: number; signedIn: number; sessions: SourceSession[] };
  totals: { sessions: number; visitors: number; views: number; social: number; search: number; direct: number };
  sources: SourceRow[]; campaigns: { source: string; label: string; campaign: string; sessions: number }[]; arrivals: SourceSession[];
};

async function readViews(since: string) {
  const rows: View[] = [];
  for (let from = 0; from < CAP; from += PAGE) {
    const { data, error } = await db().from("site_visits").select(COLUMNS).eq("event", "page_view").eq("is_bot", false)
      .gte("created_at", since).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) adminError(error);
    rows.push(...(data ?? []) as unknown as View[]);
    if ((data?.length ?? 0) < PAGE) return { rows, capped: false };
  }
  return { rows, capped: true };
}

/** One session: its first view (the landing, which carries the source), how many views, and whether it is a person. */
function sessionsOf(rows: View[], ownHosts: string[]) {
  const map = new Map<string, { first: View; last: View; views: number; signedIn: boolean; person: boolean }>();
  for (const row of rows) {
    const entry = map.get(row.session_id);
    if (!entry) map.set(row.session_id, { first: row, last: row, views: 1, signedIn: !!row.user_id, person: isAudience(row) });
    else { entry.last = row; entry.views++; entry.signedIn ||= !!row.user_id; entry.person &&= isAudience(row); }
  }
  const sessions = new Map<string, SourceSession & { visitor: string }>();
  for (const [id, { first, last, views, signedIn, person }] of map) {
    if (!person) continue;
    const source = classifySource(first, ownHosts);
    sessions.set(id, { source, label: SOURCE_LABEL[source], referrer: first.referrer_host, campaign: first.utm_campaign, landing: first.path, path: last.path,
      country: first.country, city: first.city, device: first.device, signedIn, startedAt: first.created_at, seenAt: last.created_at, views, visitor: first.visitor_id });
  }
  return sessions;
}

export async function trafficSourcesReport(days: number): Promise<TrafficSourcesReport> {
  const now = Date.now();
  const host = siteUrl().hostname.replace(/^www\./, "");
  const ownHosts = [host, "localhost", "127.0.0.1"];
  const since = new Date(now - days * 86_400_000).toISOString();
  const [{ rows, capped }, presenceRead] = await Promise.all([
    readViews(since),
    db().from("site_presence").select("session_id,path,started_at,seen_at").gte("seen_at", new Date(now - LIVE_MS).toISOString()).limit(5000),
  ]);
  if (presenceRead.error && presenceRead.error.code !== "42P01") adminError(presenceRead.error);
  const presence = (presenceRead.data ?? []) as Presence[];
  const sessions = sessionsOf(rows, ownHosts);

  // A live session that began before the window still needs its landing view for its source: read those directly.
  const missing = [...new Set(presence.map(beat => beat.session_id))].filter(id => !sessions.has(id));
  if (missing.length) {
    const { data, error } = await db().from("site_visits").select(COLUMNS).eq("event", "page_view").eq("is_bot", false)
      .in("session_id", missing.slice(0, 500)).order("created_at", { ascending: true }).limit(5000);
    if (error) adminError(error);
    for (const [id, session] of sessionsOf((data ?? []) as unknown as View[], ownHosts)) sessions.set(id, session);
  }

  // Live: the latest heartbeat per session, newest first; the session's current page is the heartbeat's page.
  const beats = new Map<string, Presence>();
  for (const beat of presence) { const seen = beats.get(beat.session_id); if (!seen || beat.seen_at > seen.seen_at) beats.set(beat.session_id, beat); }
  const live = [...beats.values()].flatMap(beat => { const session = sessions.get(beat.session_id); return session ? [{ ...session, path: beat.path, seenAt: beat.seen_at }] : []; })
    .toSorted((a, b) => b.seenAt.localeCompare(a.seenAt));
  const liveBySource = new Map<SourceId, number>();
  for (const session of live) liveBySource.set(session.source, (liveBySource.get(session.source) ?? 0) + 1);

  const inWindow = [...sessions.values()].filter(session => session.startedAt >= since);
  const table = new Map<SourceId, SourceRow & { people: Set<string> }>();
  const campaigns = new Map<string, { source: string; label: string; campaign: string; sessions: number }>();
  for (const session of inWindow) {
    const row = table.get(session.source) ?? { id: session.source, label: session.label, sessions: 0, visitors: 0, views: 0, signedIn: 0, live: 0, people: new Set<string>() };
    row.sessions++; row.views += session.views; row.people.add(session.visitor); if (session.signedIn) row.signedIn++;
    table.set(session.source, row);
    if (session.campaign) { const key = `${session.source}|${session.campaign}`; const entry = campaigns.get(key) ?? { source: session.source, label: session.label, campaign: session.campaign, sessions: 0 }; entry.sessions++; campaigns.set(key, entry); }
  }
  for (const [id, count] of liveBySource) { if (!table.has(id)) table.set(id, { id, label: SOURCE_LABEL[id], sessions: 0, visitors: 0, views: 0, signedIn: 0, live: 0, people: new Set() }); table.get(id)!.live = count; }
  const sources = [...table.values()].map(({ people, ...row }) => ({ ...row, visitors: people.size })).toSorted((a, b) => b.live - a.live || b.sessions - a.sessions);
  const sum = (pick: (row: SourceRow) => boolean) => sources.filter(pick).reduce((total, row) => total + row.sessions, 0);
  const strip = (session: SourceSession & { visitor: string }): SourceSession => { const { visitor, ...rest } = session; void visitor; return rest; };
  return {
    generatedAt: new Date(now).toISOString(), liveSeconds: LIVE_MS / 1000, days, capped,
    live: { total: live.length, signedIn: live.filter(session => session.signedIn).length, sessions: live.slice(0, 100).map(strip) },
    totals: { sessions: inWindow.length, visitors: new Set(inWindow.map(session => session.visitor)).size, views: inWindow.reduce((total, session) => total + session.views, 0),
      social: sum(row => SOCIAL_SOURCES.has(row.id)), search: sum(row => row.id === "google" || row.id === "bing" || row.id === "search"), direct: sum(row => row.id === "direct") },
    sources, campaigns: [...campaigns.values()].toSorted((a, b) => b.sessions - a.sessions).slice(0, 20),
    arrivals: inWindow.toSorted((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 60).map(strip),
  };
}
