"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, BookOpen, BookOpenText, Bot, CalendarClock, CheckCircle2, Clock, Cpu, Database, EyeOff, Flame, Gauge, Globe2, Hourglass, Languages, Laptop, Link2, LogIn, LogOut, MapPin, Monitor, MousePointerClick, Network, Pause, Play, Radio, RefreshCw, Route, Server, Smartphone, Sparkles, Tablet, Target, Timer, TrendingDown, UserPlus, UserRound, Users, Zap, type LucideIcon } from "lucide-react";
import { Flag, countryName } from "./super-admin-audience";
import { Pager } from "./super-admin-table";
import styles from "./super-admin-overview-live.module.css";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import { indexVisits, periodSummary, streamVisitors, type Presence, type StreamApiCall, type StreamClick, type StreamVisitor } from "@/lib/live-visits";
import { verifyLiveFigures, MAX_READ_AGE_MS } from "@/lib/live-verify";
import { localityPin } from "@/lib/new-user-locations";
import { VisitorRoutes } from "./super-admin-visitor-routes";
import { FirstLookVisitors } from "./super-admin-first-look";
import { PrivateVisitors } from "./super-admin-private-visitors";

type Row = Record<string, unknown>;
type Visit = { id?: number; created_at: string; event: string; utm_medium?: string | null; utm_campaign?: string | null; person?: string; email?: string | null; user_id?: string | null; visitor_id: string; session_id: string; new_visitor?: boolean; path: string; title?: string | null; country?: string | null; city?: string | null; region?: string | null; postal_code?: string | null; device?: string | null; browser?: string | null; os?: string | null; duration_ms?: number | null; referrer_host?: string | null; utm_source?: string | null; screen?: string | null; timezone?: string | null; language?: string | null; ip_masked?: string | null; private_mode?: boolean | null };
type Live = {
  generatedAt: string;
  /** "today": counted from 00:00 IST (migration 0045); "24h": the rolling day it falls back to. */
  window?: "today" | "24h";
  totals: { liveNow: number; liveSignedIn: number; pageViews: number; visitors: number; bounceRate: number | null; avgSessionSeconds: number | null; people?: number; sessions?: number; signedInUsers?: number; newVisitors?: number; newAccounts?: number; pagesPerSession?: number | null; bots?: number };
  hours: { hour: number; views: number }[]; recent: Visit[]; people?: Person[];
  pages?: { path: string; views: number; visitors: number; avg_seconds: number | null }[]; referrers?: { referrer: string; views: number; visitors: number }[];
  countries?: { country: string; visitors: number; views: number }[]; devices?: { device: string; visitors: number }[];
};
type Person = { person: string; sessions: number; engaged_seconds: number; first_seen: string };
export type OverviewSnapshot = { generatedAt: string; events: Row[]; requests: { count: number; errors: number; p95: number | null }; health: { databaseMs: number; processUptime: number; processMemory: number; hostMemory: number; hostUsedMemory: number; cpuCores: number; cpuPercent?: number | null; environment?: string; nodeVersion?: string } };

// Everything in the Live command centre and visitor stream is re-read every 5 seconds, silently: no running timers or
// loading states on screen, the figures just change (user requests 2026-11-01). The stream is read incrementally (only
// rows since the last read); the report and the snapshot skip a tick while the previous read is still in flight.
const REFRESH_MS = 5_000;
// Rows per page in each paginated panel.
const STREAM_PAGE = 3, TRACE_PAGE = 10, READING_PAGE = 6;
const pageOf = <T,>(rows: T[], page: number, size: number) => rows.slice((Math.min(page, Math.max(1, Math.ceil(rows.length / size))) - 1) * size, Math.min(page, Math.max(1, Math.ceil(rows.length / size))) * size);
const pagesOf = (rows: unknown[], size: number) => Math.max(1, Math.ceil(rows.length / size));
const n = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN").format(value);
const since = (iso: unknown, now: number) => {
  if (!iso) return "—";
  // Accepts an ISO string or epoch milliseconds (the visitor stream keeps Left as a number).
  const s = Math.max(0, (now - new Date(typeof iso === "number" ? iso : String(iso)).getTime()) / 1000);
  // No seconds: a count that changes on every refresh reads as a running timer (user request 2026-11-01).
  return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
};
const spent = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
};
// The visitor stream's Date, Arrived and Left columns, in India time (times to the second).
const dayOf = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const clock = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));
/** For stamps that move with every refresh: seconds there would read as a running timer (user request 2026-11-01). */
const clockMinute = (iso: string | number) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));
type StreamFilter = "all" | "live" | "signed" | "new" | "private";
// The stream's own feed, merged across refreshes: rows by id, page heartbeats by session and path.
type StreamFeed = { rows: Map<string, Visit>; emails: Record<string, string>; presence: Map<string, Presence> | null; clicks: Map<string, StreamClick>; apiCalls: Map<string, StreamApiCall>; automated: Set<string>; days: number; capped: boolean; generatedAt: string; loadedAt: number };
// The whole window is read again every 10 minutes; in between, each refresh asks only for what is new.
const FULL_RELOAD_MS = 10 * 60_000;
// A read that never answers must not hold the next ones back: the busy guards below would keep the figures frozen.
const READ_TIMEOUT_MS = 30_000;
const withTimeout = (signal?: AbortSignal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(READ_TIMEOUT_MS)]) : AbortSignal.timeout(READ_TIMEOUT_MS);
const rowId = (v: Visit) => v.id != null ? String(v.id) : `${v.created_at}|${v.event}|${v.session_id}|${v.path}`;
const clickId = (c: StreamClick) => `${c.created_at}|${c.session_id}|${c.option}`;
/** The visitor's own clock, from the time zone their browser reported: "Sat, 08:05 am · morning". */
const localTime = (timezone: string | null | undefined, now: number) => {
  if (!timezone) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(now));
    const hour = Number(parts.find(part => part.type === "hour")?.value ?? NaN);
    const part = hour < 5 ? "late night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
    const text = new Intl.DateTimeFormat("en-IN", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(now));
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" }).formatToParts(new Date(now)).find(p => p.type === "timeZoneName")?.value;
    return { text, part, offset: offset?.replace("GMT", "UTC") ?? null };
  } catch { return null; }
};
const languageName = (tag: string | null | undefined) => {
  if (!tag) return null;
  try { return new Intl.DisplayNames(["en"], { type: "language" }).of(tag) ?? tag; } catch { return tag; }
};
const TIMING_NOTE: Record<StreamVisitor["visit"]["timing"], string> = {
  live: "Estimated live duration since the latest signal; a recent signal does not confirm the page is still open.",
  recorded: "Recorded visible time. A leave signal can mean a hidden tab or navigation, not a confirmed session exit. Network delay can affect timestamps.",
  partial: "Incomplete timing: shown through the last recorded signal. Actual departure and any missing reading time are unknown.",
};
const bytes = (value: number) => value >= 1 << 30 ? `${(value / (1 << 30)).toFixed(1)} GB` : `${Math.round(value / (1 << 20))} MB`;
const uptime = (seconds: number) => seconds >= 86400 ? `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h` : seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : `${Math.round(seconds / 60)}m`;
const DEVICE_ICON: Record<string, LucideIcon> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };
type TraceFilter = "all" | "client" | "server" | "slow";
const STREAM_FILTERS: { id: StreamFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Users }, { id: "live", label: "On the site now", icon: Radio }, { id: "signed", label: "Signed in", icon: UserRound }, { id: "new", label: "New visitors", icon: Sparkles },
  { id: "private", label: "Private window", icon: EyeOff },
];
const TRACE_FILTERS: { id: TraceFilter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All", icon: Activity }, { id: "client", label: "4xx", icon: AlertTriangle }, { id: "server", label: "5xx", icon: Server }, { id: "slow", label: "Slow ≥1 s", icon: Clock },
];
/** The value below which `q` of the sorted durations fall. */
const quantile = (sorted: number[], q: number) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : null;
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 1000) / 10}%` : "—";
/** The current hour in India, to match the IST hourly bars whatever this browser's time zone. */
const istHour = (ms: number) => new Date(ms + 5.5 * 3600_000).getUTCHours();
/** 00:00 IST of the day containing ms: every card counts from here, so the command centre starts fresh each day. */
const istMidnight = (ms: number) => Math.floor((ms + 19_800_000) / 86_400_000) * 86_400_000 - 19_800_000;
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
const statusTone = (status: number | null) => status == null ? "info" : status >= 500 ? "error" : status >= 400 ? "warn" : "ok";

/**
 * The Overview's live command centre: who is on the site right now and what they are doing, request tracing
 * from the application event log, the last 24 hours at a glance and system health. Refreshes every 5 seconds while
 * the tab is visible (pausable), re-checks the figures each time (lib/live-verify.ts); every panel has its own light tone.
 */
export function OverviewLive({ snapshot, onRefreshSnapshot }: { snapshot: OverviewSnapshot | null; onRefreshSnapshot: () => void }) {
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [traceFilter, setTraceFilter] = useState<TraceFilter>("all");
  const [visitPage, setVisitPage] = useState(1);
  const [tracePage, setTracePage] = useState(1);
  const [readPage, setReadPage] = useState(1);
  const [streamFilter, setStreamFilter] = useState<StreamFilter>("all");
  // The server's clock minus this browser's, so "reading for 1m 03s" is measured on the clock that stamped the rows.
  const [offset, setOffset] = useState(0);
  // When the previous refresh happened, so visitors who arrived since then can be highlighted.
  const [freshSince, setFreshSince] = useState<number | null>(null);
  // The Live visitor stream's own feed: every visit of the last VISIT_RETENTION_DAYS days (the 24 h report above
  // keeps only its newest 500 events), kept in a ref between refreshes so each one only fetches what is new.
  const [stream, setStream] = useState<StreamFeed | null>(null);
  const [streamFailed, setStreamFailed] = useState(false);
  // The newest read failed: the figures on screen are the last good ones, and the page says so.
  const [streamStale, setStreamStale] = useState(false);
  const [readAt, setReadAt] = useState<number | null>(null);
  const feed = useRef<StreamFeed | null>(null);
  const streamBusy = useRef(false);

  const loadStream = useCallback(async (signal?: AbortSignal) => {
    // One read at a time: two incremental reads built on the same prior feed would each drop the other's rows.
    if (streamBusy.current) return;
    streamBusy.current = true;
    try {
      const prior = feed.current, startedAt = Date.now();
      const incremental = prior && startedAt - prior.loadedAt < FULL_RELOAD_MS;
      // A minute of overlap: a row stamped just before the last read can land just after it.
      const query = incremental ? `?since=${encodeURIComponent(new Date(Date.parse(prior.generatedAt) - 60_000).toISOString())}` : "";
      const response = await fetch(`/api/super-admin/activity/stream${query}`, { cache: "no-store", signal: withTimeout(signal) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(body?.visits)) { setStreamStale(true); if (!feed.current) setStreamFailed(true); return; }
      const days = Number(body.days) || VISIT_RETENTION_DAYS, generatedAt = typeof body.generatedAt === "string" ? body.generatedAt : new Date().toISOString();
      const windowStart = Date.parse(generatedAt) - days * 86_400_000;
      const rows = new Map(incremental ? prior.rows : []);
      const rowsBefore = rows.size;
      // A session judged automated is dropped by the read that sees its page view; later reads see only its newer rows, so
      // it is remembered here. Those rows used to show one visitor too many until the next full reload.
      const automated = new Set<string>([...(incremental ? prior.automated : []), ...(Array.isArray(body.automated) ? body.automated as string[] : [])]);
      for (const v of body.visits as Visit[]) if (!automated.has(v.session_id)) rows.set(rowId(v), v);
      // A session can be judged automated, or its browser's owner excluded, after its first rows arrived.
      for (const [id, v] of rows) if (automated.has(v.session_id)) rows.delete(id);
      for (const [id, v] of rows) if (Date.parse(v.created_at) < windowStart) rows.delete(id);
      const presence = Array.isArray(body.presence) ? new Map(incremental && prior.presence ? prior.presence : []) : null;
      if (presence) for (const p of body.presence as Presence[]) presence.set(`${p.session_id}|${p.path}`, p);
      const clicks = new Map(incremental ? prior.clicks : []);
      for (const c of Array.isArray(body.clicks) ? body.clicks as StreamClick[] : []) clicks.set(clickId(c), c);
      for (const [id, c] of clicks) if (Date.parse(c.created_at) < windowStart) clicks.delete(id);
      const apiCalls = new Map(incremental ? prior.apiCalls : []);
      for (const c of Array.isArray(body.apiCalls) ? body.apiCalls as StreamApiCall[] : []) apiCalls.set(c.id, c);
      for (const [id, c] of apiCalls) if (Date.parse(c.created_at) < windowStart) apiCalls.delete(id);
      const next: StreamFeed = { rows, presence, clicks, apiCalls, automated, days, generatedAt, emails: { ...(incremental ? prior.emails : {}), ...(body.emails ?? {}) },
        capped: Boolean(body.capped) || Boolean(incremental && prior.capped), loadedAt: incremental ? prior.loadedAt : startedAt };
      // Half the round trip is the best estimate of when the server stamped generatedAt.
      setOffset(Date.parse(generatedAt) - (startedAt + Date.now()) / 2);
      // "New since the last refresh" moves only when a read brought rows, so a 5 s poll does not wipe the highlight.
      if (!incremental || rows.size !== rowsBefore) setFreshSince(prior ? Date.parse(prior.generatedAt) : null);
      // The section's clock moves only with new data: no running timers on screen, figures change silently (user request 2026-11-01).
      feed.current = next; setStream(next); setNow(Date.now()); setReadAt(Date.now()); setStreamStale(false);
    } catch { if (!signal?.aborted) { setStreamStale(true); if (!feed.current) setStreamFailed(true); } /* the stream falls back to the 24 h report's recent visits */ }
    finally { streamBusy.current = false; }
  }, []);
  const reportBusy = useRef(false), hasReport = useRef(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    void loadStream(signal);
    if (reportBusy.current) return;
    reportBusy.current = true;
    try {
      const response = await fetch("/api/super-admin/activity?day=today", { cache: "no-store", signal: withTimeout(signal) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      // A malformed payload must degrade this panel, never take the whole dashboard down with it.
      if (typeof body?.totals !== "object" || body.totals === null || !Array.isArray(body.recent) || !Array.isArray(body.hours)) throw new Error("service_error");
      setLive(body); setNow(Date.now()); hasReport.current = true;
      setError("");
    } catch (e) {
      // A failed background read keeps the figures already shown; the warning is only for a report that never loaded.
      if (!signal?.aborted && !(e instanceof DOMException) && !hasReport.current) setError(e instanceof Error && e.message === "migration_required" ? "Live visitor tracking needs migration 0023 (User activity)." : "Live tracking is unavailable right now; retrying.");
    }
    finally { reportBusy.current = false; }
  }, [loadStream]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal); });
    if (paused) return () => controller.abort();
    const timer = setInterval(() => { if (document.visibilityState === "visible") { void load(controller.signal); onRefreshSnapshot(); } }, REFRESH_MS);
    // Back on a hidden tab: refresh at once instead of showing figures from when it was left.
    const onVisible = () => { if (document.visibilityState === "visible") { void load(controller.signal); onRefreshSnapshot(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load, paused, onRefreshSnapshot]);

  // The SQL report counts each browser cookie as a visitor and the stream counts each person, so showing the report while
  // the stream loads made figures jump (Visitors, today read one too many for a moment). It stands in only if the stream
  // cannot load; until then the visitor figures stay blank, so the first number on screen is the right one.
  const report = stream || streamFailed ? live : null;
  const streamRows = useMemo(() => stream ? [...stream.rows.values()] : report?.recent ?? [], [stream, report]);
  const streamDays = stream?.days ?? 1;
  const clockNow = now + offset;
  const dayStart = istMidnight(clockNow);
  // A short window (last hour, 30 minutes) is exactly that long, across midnight too: clamped to 00:00 IST it showed a
  // few minutes under a "last hour" label just after midnight. The stream holds several days, so the rows are there.
  const notBefore = (ms: number) => clockNow - ms;
  // The stream always covers today; only the SQL fallback can be the rolling 24 h (before migration 0045).
  const day = !(stream && !stream.capped) && live?.window === "24h" ? "24 h" : "today";
  // Who each visitor is and what is known about every page they opened (lib/live-visits.ts); only the open pages'
  // clocks move each second, so the grouping runs when the data changes and the timing pass on every tick.
  // Indexes visits and presence; includes all live visitors and active sessions.
  const index = useMemo(() => indexVisits(streamRows, stream ? stream.presence && [...stream.presence.values()] : null, stream ? [...stream.clicks.values()] : []), [streamRows, stream]);
  const streamApiCalls = useMemo(() => stream ? [...stream.apiCalls.values()] : [], [stream]);
  const everyone = useMemo(() => streamVisitors(index, clockNow, stream?.emails), [index, clockNow, stream]);
  const counts = useMemo(() => ({
    all: everyone.length, live: everyone.filter(v => v.live).length, signed: everyone.filter(v => v.signedIn).length,
    new: everyone.filter(v => v.first.new_visitor && !v.signedIn).length,
    private: everyone.filter(v => v.privateWindow).length,
    liveSigned: everyone.filter(v => v.live && v.signedIn).length,
    recent: everyone.filter(v => v.lastAt >= notBefore(30 * 60_000)).length,
    recentSigned: everyone.filter(v => v.signedIn && v.lastAt >= notBefore(30 * 60_000)).length,
    // The stream panel's own figures, over the whole stream window, from the same visitors the cards list (views of
    // visitors under a second are not shown, so they no longer inflate pages per visitor).
    views: everyone.reduce((sum, v) => sum + v.views, 0),
    engaged: everyone.length ? everyone.reduce((sum, v) => sum + v.engagedMs, 0) / everyone.length : null,
    pages: everyone.length ? Math.round((everyone.reduce((sum, v) => sum + v.views, 0) / everyone.length) * 10) / 10 : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps -- notBefore() reads clockNow
  }), [everyone, clockNow]);
  // Every visitor figure below is counted from `everyone`, the list the stream's cards show (lib/live-visits.ts
  // periodSummary): bots, automated browsers and visitors under a second left out, one person per account or linked
  // device. They used to mix three sources (the SQL report counted each browser cookie as a visitor, the last-hour and
  // last-30-minute panels counted raw rows, and pages' average read was per visible stretch, not per view), so tiles
  // side by side disagreed. The SQL report stands in only while the stream is loading or capped.
  const ownHosts = useMemo(() => typeof window === "undefined" ? [] : [window.location.hostname.replace(/^www\./, "")], []);
  const exact = Boolean(stream && !stream.capped);
  const todaySum = useMemo(() => periodSummary(everyone, dayStart, Infinity, ownHosts), [everyone, dayStart, ownHosts]);
  const hourSum = useMemo(() => periodSummary(everyone, clockNow - 3600_000, Infinity, ownHosts), [everyone, clockNow, ownHosts]);
  const readSum = useMemo(() => periodSummary(everyone, clockNow - 30 * 60_000, Infinity, ownHosts), [everyone, clockNow, ownHosts]);
  // The rolling 24 hours, beside "today" (from 00:00 IST): early in the IST day, today alone looks small.
  const daySum = useMemo(() => periodSummary(everyone, clockNow - 86_400_000, Infinity, ownHosts), [everyone, clockNow, ownHosts]);
  // Every refresh, the figures are checked before the panel calls them verified (lib/live-verify.ts). clockNow only moves
  // when a read lands, so a frozen feed would look fresh by it: how old the read is goes by this separate wall clock.
  const [wallClock, setWallClock] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setWallClock(Date.now()), MAX_READ_AGE_MS / 2); return () => clearInterval(timer); }, []);
  const checks = useMemo(() => {
    if (!stream) return null;
    const unfiltered = streamVisitors(index, clockNow, stream.emails, false);
    return verifyLiveFigures({
      now: Math.max(clockNow, wallClock + offset), dayStart, rows: streamRows, today: todaySum, day: daySum, todayAll: periodSummary(unfiltered, dayStart, Infinity, ownHosts), visitors: everyone,
      stale: streamStale, capped: stream.capped, readAt: readAt == null ? null : readAt + offset,
      report: live && live.window !== "24h" && !paused ? { pageViews: live.totals.pageViews, visitors: live.totals.visitors, sessions: live.totals.sessions } : null,
    });
  }, [stream, index, clockNow, wallClock, offset, dayStart, streamRows, todaySum, daySum, ownHosts, everyone, streamStale, readAt, live, paused]);
  const failed = checks?.filter(check => !check.ok) ?? [];
  const visitors = useMemo(() => everyone.filter(v => streamFilter === "all" || (streamFilter === "live" ? v.live : streamFilter === "signed" ? v.signedIn : streamFilter === "private" ? Boolean(v.privateWindow) : v.first.new_visitor && !v.signedIn)), [everyone, streamFilter]);
  const heartbeats = Boolean(stream?.presence);
  const reading = readSum.pages;
  const devices = hourSum.devices;
  // Today's figures: from the stream when it holds the whole day, otherwise from the SQL report (labelled as such).
  const t = report?.totals;
  // New accounts and bots filtered come from the database report, so they take its window, not the stream's: before
  // migration 0045 that report is the rolling 24 h even while the stream covers today.
  const sqlDay = live?.window === "24h" ? "24 h" : "today";
  const fig = exact ? {
    views: todaySum.views, people: todaySum.people, sessions: todaySum.sessions, signedIn: todaySum.signedIn, newVisitors: todaySum.newVisitors,
    bounceRate: todaySum.bounceRate, avgSessionSeconds: todaySum.avgStayMs == null ? null : todaySum.avgStayMs / 1000, pagesPerSession: todaySum.pagesPerSession,
    readingPerPerson: todaySum.readingPerPersonMs, hours: todaySum.hours,
    topPage: todaySum.pages[0] ? { path: todaySum.pages[0].path, views: todaySum.pages[0].views, people: todaySum.pages[0].people, avgSeconds: todaySum.pages[0].avgReadMs == null ? null : Math.round(todaySum.pages[0].avgReadMs / 1000) } : null,
    topSource: todaySum.sources[0] ? { name: todaySum.sources[0].source, people: todaySum.sources[0].people } : null,
    topCountry: todaySum.countries.find(c => c.country !== "Unknown") ?? null,
    devices: todaySum.devices,
  } : {
    views: t?.pageViews, people: t?.people ?? t?.visitors, sessions: t?.sessions, signedIn: t?.signedInUsers, newVisitors: t?.newVisitors,
    bounceRate: t?.bounceRate ?? null, avgSessionSeconds: t?.avgSessionSeconds ?? null, pagesPerSession: t?.pagesPerSession ?? null,
    readingPerPerson: null as number | null, hours: Array.from({ length: 24 }, (_, hour) => report?.hours.find(x => x.hour === hour)?.views ?? 0),
    topPage: report?.pages?.[0] ? { path: report.pages[0].path, views: report.pages[0].views, people: report.pages[0].visitors, avgSeconds: report.pages[0].avg_seconds } : null,
    topSource: report?.referrers?.[0] ? { name: report.referrers[0].referrer, people: report.referrers[0].visitors } : null,
    topCountry: (({ country, visitors: people }) => country ? { country, people } : null)(report?.countries?.find(c => c.country !== "Unknown") ?? { country: "", visitors: 0 }),
    devices: (report?.devices ?? []).map(d => ({ device: d.device.toLowerCase(), people: Number(d.visitors) })),
  };

  const requests = useMemo(() => (snapshot?.events ?? []).filter(e => e.kind === "request"), [snapshot]);
  const traces = useMemo(() => requests.filter(e => {
    const status = Number(e.status), ms = Number(e.duration_ms);
    return traceFilter === "all" || (traceFilter === "client" ? status >= 400 && status < 500 : traceFilter === "server" ? status >= 500 : ms >= 1000);
  }), [requests, traceFilter]);
  // What the loaded request sample says: status classes, latency spread and the busiest routes with their health.
  const traceStats = useMemo(() => {
    const ms = requests.map(e => Number(e.duration_ms) || 0).sort((a, b) => a - b);
    const routes = new Map<string, { calls: number; errors: number; total: number; slowest: number; methods: Set<string> }>();
    for (const e of requests) {
      const route = String(e.resource ?? "—"), entry = routes.get(route) ?? { calls: 0, errors: 0, total: 0, slowest: 0, methods: new Set<string>() };
      const d = Number(e.duration_ms) || 0;
      entry.calls++; entry.total += d; entry.slowest = Math.max(entry.slowest, d); entry.methods.add(String(e.action ?? "—"));
      if (Number(e.status) >= 400) entry.errors++;
      routes.set(route, entry);
    }
    return {
      client: requests.filter(e => Number(e.status) >= 400 && Number(e.status) < 500).length, server: requests.filter(e => Number(e.status) >= 500).length,
      slow: ms.filter(d => d >= 1000).length, p50: quantile(ms, 0.5), p95: quantile(ms, 0.95), max: ms.at(-1) ?? null,
      avg: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null,
      routes: [...routes].map(([route, e]) => ({ route, ...e, avg: Math.round(e.total / e.calls) })).sort((a, b) => b.calls - a.calls || b.errors - a.errors).slice(0, 5),
    };
  }, [requests]);
  const slowest = Math.max(1, ...traces.map(e => Number(e.duration_ms) || 0));
  const visitRows = pageOf(visitors, visitPage, STREAM_PAGE), traceRows = pageOf(traces, tracePage, TRACE_PAGE), readRows = pageOf(reading, readPage, READING_PAGE);
  const hours = fig.hours;
  const peak = Math.max(1, ...hours);
  const h = snapshot?.health;

  // Visitor figures only (user request 2026-11-01). API volume, errors and latency are in Request tracing and System
  // health below: their 15-minute counts here came from the loaded request sample, not every request.
  const kpis: { label: string; value: string; note: string; icon: LucideIcon; tone: string; pulse?: boolean }[] = [
    heartbeats
      ? { label: "On the site now", value: n(counts.live), note: `${n(counts.liveSigned)} signed in · page open now`, icon: Radio, tone: "mint", pulse: true }
      : { label: "On the site now", value: n(report?.totals.liveNow), note: `${n(report?.totals.liveSignedIn)} signed in · page open now`, icon: Radio, tone: "mint", pulse: true },
    { label: "Page views, last hour", value: n(hourSum.views), note: `by ${n(hourSum.people)} ${hourSum.people === 1 ? "person" : "people"}`, icon: MousePointerClick, tone: "sky" },
    { label: `Visitors, ${day}`, value: n(fig.people), note: `${day === "today" ? "since 00:00 IST · " : ""}${n(fig.views)} page views · ${n(fig.signedIn)} signed in · ${n(fig.newVisitors)} ${exact ? "new guests" : "new"}${exact ? ` · ${n(todaySum.returning)} returning` : ""}`, icon: Users, tone: "lavender" },
    ...(exact ? [{ label: "Visitors, last 24 hours", value: n(daySum.people), note: `rolling, since ${clockMinute(clockNow - 86_400_000)} IST yesterday · ${n(daySum.views)} page views · ${n(daySum.sessions)} visits`, icon: CalendarClock, tone: "sky" }] : []),
    { label: "Active, last 30 min", value: n(counts.recent), note: `${n(counts.recentSigned)} of them signed in`, icon: Flame, tone: "rose" },
    { label: `New accounts, ${sqlDay}`, value: n(t?.newAccounts), note: sqlDay === "today" ? "sign-ups since 00:00 IST" : "sign-ups in the last 24 h", icon: UserPlus, tone: "mint" },
    { label: `Reading time per visitor, ${day}`, value: fig.readingPerPerson == null ? "—" : spent(fig.readingPerPerson / 1000), note: fig.people ? `pages on screen · ${Math.round(((fig.views ?? 0) / fig.people) * 10) / 10} pages each` : "pages on screen", icon: Hourglass, tone: "sky" },
    { label: `Bounce rate, ${day}`, value: fig.bounceRate == null ? "—" : `${fig.bounceRate}%`, note: `visits that opened one page${fig.avgSessionSeconds == null ? "" : ` · avg visit ${spent(fig.avgSessionSeconds)}`}`, icon: TrendingDown, tone: "lavender" },
    { label: `Bot sessions filtered, ${sqlDay}`, value: n(live?.totals.bots), note: "crawlers and automated browsers, excluded from every figure", icon: Bot, tone: "sage" },
  ];

  return <section className={styles.live} aria-label="Live command centre">
    <header className={styles.head}>
      <div><p className={styles.kicker}><span className={styles.dot} data-paused={paused || undefined} aria-hidden="true" />{paused ? "Live updates paused" : "Live"}</p><h2>Live command centre</h2></div>
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => { void load(); onRefreshSnapshot(); }}><RefreshCw size={14} aria-hidden="true" />Refresh</button>
        <button type="button" className={styles.button} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? "Resume" : "Pause"}</button>
      </div>
    </header>
    {error && <p className={styles.warn} role="status">{error}</p>}
    {checks && <details className={styles.verify} data-ok={failed.length ? undefined : ""}>
      <summary>
        {failed.length ? <AlertTriangle size={15} aria-hidden="true" /> : <CheckCircle2 size={15} aria-hidden="true" />}
        <span role="status">{paused ? "Live updates paused: figures are from when you paused" : failed.length ? `Check these figures: ${failed.map(check => check.label.toLowerCase()).join(", ")}` : `Verified: ${checks.length} of ${checks.length} checks passed${readAt ? ` at ${clockMinute(readAt)} IST` : ""}`}</span>
        <small>See the checks</small>
      </summary>
      <ul>{checks.map(check => <li key={check.id} data-ok={check.ok ? "" : undefined}>{check.ok ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}<div><b>{check.label}</b><span>{check.detail}</span></div></li>)}</ul>
    </details>}

    <div className={styles.kpis}>
      {kpis.map(({ label, value, note, icon: Icon, tone, pulse }) => <div key={label} className={styles.kpi} data-tone={tone}>
        <span className={styles.kpiIcon} aria-hidden="true">{pulse && <i className={styles.ring} />}<Icon size={16} /></span>
        <span className={styles.kpiLabel} title={label}>{label}</span><strong>{value}</strong><small>{note}</small>
      </div>)}
    </div>
    <details className={styles.howCounted}>
      <summary>How these numbers are counted</summary>
      <ul>
        <li><b>Visitor</b>: one person: a signed-in account, or one device (its visits before and after a cookie reset are linked). The cards in the Live visitor stream are these same visitors.</li>
        <li><b>Visit</b>: one sitting; it ends after 30 minutes without activity. <b>Page view</b>: a page that stayed on screen for at least a second.</li>
        <li><b>Left out everywhere</b>: crawlers, automated browsers, this site&apos;s own machines and anyone who stayed under a second.</li>
        <li><b>Reading time</b>: time pages were visible on screen (a hidden tab does not count). <b>Bounce</b>: a visit that opened only one page. <b>New guests</b>: first-time visitors who have not signed in; a first-time visitor who signs up counts under signed in and new accounts.</li>
        <li><b>Today</b> starts at 00:00 IST. <b>On the site now</b>: a page sent a heartbeat in the last 100 seconds and has not closed.</li>
        <li>Visitor figures come from the visitor stream; new accounts and bots filtered come from the database.{exact ? "" : " The stream has not loaded the whole day yet, so the database report is shown for now."}</li>
      </ul>
    </details>

    <div className={styles.grid}>
      <article className={`${styles.panel} ${styles.full}`} data-tone="mint">
        <h3><Radio size={16} aria-hidden="true" />Live visitor stream<span>{everyone.length ? `${n(everyone.length)} ${everyone.length === 1 ? "visitor" : "visitors"} · ${n(counts.views)} views in ${stream ? `the last ${streamDays} ${streamDays === 1 ? "day" : "days"}` : "the 24 h report's newest events (full stream loading)"} · newest first` : ""}</span></h3>
        {everyone.length > 0 && <div className={styles.streamBar}>
          <dl className={styles.streamStats}>
            <div data-live={counts.live > 0 || undefined}><dt>On the site now</dt><dd>{n(counts.live)}</dd><small>{counts.live ? `${n(counts.liveSigned)} signed in · ${heartbeats ? "page open now" : "page opened in the last 30 min"}` : "nobody has a page open"}</small></div>
            <div><dt>Last activity</dt><dd>{since(everyone[0].live ? clockNow : everyone[0].lastAt, clockNow)}</dd><small>{everyone[0].live ? "a visitor is reading now" : `by visitor #1, ${clock(everyone[0].lastAt)} IST`}</small></div>
            <div><dt>Reading time per visitor</dt><dd>{counts.engaged == null ? "—" : spent(counts.engaged / 1000)}</dd><small>pages on screen, all visits</small></div>
            <div><dt>Pages per visitor</dt><dd>{counts.pages ?? "—"}</dd><small>{n(counts.signed)} signed in · {n(counts.new)} new guests</small></div>
          </dl>
          <div className={styles.filters} role="group" aria-label="Show visitors">{STREAM_FILTERS.map(f => <button key={f.id} type="button" aria-pressed={streamFilter === f.id} onClick={() => { setStreamFilter(f.id); setVisitPage(1); }}><f.icon size={12} aria-hidden="true" />{f.label} <b>{n(counts[f.id])}</b></button>)}</div>
        </div>}
        {visitors.length ? <>
          <VisitorRoutes visitors={visitors} apiCalls={streamApiCalls} />
          <div className={styles.streamTableWrap}>
            <div className={styles.streamHeadRow} aria-hidden="true">
              <span className={styles.streamHeadTitle}>
                <Activity size={13} aria-hidden="true" />
                Visitor Logs
              </span>
              <span className={styles.streamHeadNote}>
                Who each visitor is, where the network places them, how long they stayed and what they read
              </span>
            </div>
            <ol className={styles.streamList}>
              {visitRows.map((row, i) => {
                const v = row.current;
                // Position in the filtered list, newest first, counted across pages: #1 is the latest activity.
                const rank = (Math.min(visitPage, pagesOf(visitors, STREAM_PAGE)) - 1) * STREAM_PAGE + i + 1;
                const Device = DEVICE_ICON[(v.device || "desktop").toLowerCase()] ?? Laptop;
                const code = v.country ?? row.first.country ?? "";
                const cleanCountry = code ? countryName(code) || code : "";
                const p = row.page;
                const rawPin = row.postalCode || v.postal_code || row.first.postal_code || null;
                // A city's head post office PIN (…001 in India) only names the city, so it is labelled as such.
                const pin = localityPin(rawPin, code || null);
                const place = [v.city, v.region].filter(Boolean).join(", ");
                const isLive = row.live;
                const visit = row.visit;
                const local = localTime(v.timezone ?? row.first.timezone, clockNow);
                const language = v.language ?? row.first.language ?? null;
                const earlier = row.visits.filter(other => other !== visit).reverse();
                const steps = visit.steps;

                return (
                  <li key={row.key} className={styles.streamRow} data-live={isLive || undefined} data-new={freshSince != null && Date.parse(row.arrived) > freshSince || undefined} aria-label={`Visitor ${rank} of ${visitors.length}`}>
                    <div className={styles.compactVisitorCard}>
                      {/* Card Top Command Bar */}
                      <div className={styles.compactTopBar}>
                        <div className={styles.compactTopLeft}>
                          <span className={styles.rankNo} title={`#${rank} of ${visitors.length}, newest activity first`}>#{rank}</span>
                          <div className={styles.compactAvatar}>
                            <UserRound size={13} className={styles.avatarIcon} aria-hidden="true" />
                            {isLive && <span className={styles.liveAvatarPing} aria-hidden="true" />}
                          </div>
                          <div className={styles.compactIdentityWrap}>
                            <div className={styles.compactNameLine}>
                              <strong className={styles.compactName} title={row.email ?? (row.first.new_visitor ? "New visitor" : "Returning visitor")}>
                                {row.email ?? (row.first.new_visitor ? "New visitor" : "Returning visitor")}
                              </strong>
                              {row.signedIn ? (
                                <span className={styles.badgeSignedIn}><CheckCircle2 size={10} aria-hidden="true" /> Signed In</span>
                              ) : row.first.new_visitor ? (
                                <span className={styles.badgeNew}><Sparkles size={10} aria-hidden="true" /> New visitor</span>
                              ) : (
                                <span className={styles.badgeReturning}>Returning</span>
                              )}
                              {row.privateWindow && <span className={styles.badgePrivate} title={row.privateWindow === "detected" ? "The browser reported a private window" : "A known device arrived with a brand-new cookie: a private window, or cookies were cleared"}>
                                <EyeOff size={10} aria-hidden="true" /> {row.privateWindow === "detected" ? "Private window" : "Likely private"}
                              </span>}
                              <code className={styles.idChip}>ID: {row.key.replace(/^(visitor|device):/, "").slice(0, 8)}</code>
                            </div>
                            <div className={styles.compactMetaLine}>
                              <span>{row.views} {row.views === 1 ? "page view" : "page views"}{row.pages > 1 ? ` · ${row.pages} pages` : ""}</span>
                              <span className={styles.dotSep}>•</span>
                              <span title="Visits (sessions) in the stream window; a visit ends after 30 idle minutes">{row.sessions} {row.sessions === 1 ? "visit" : "visits"}</span>
                              <span className={styles.dotSep}>•</span>
                              <span title={`First page view in the window: ${dayOf(row.firstArrived)} ${clock(row.firstArrived)} IST`}>First seen {since(row.firstArrived, clockNow)}</span>
                              {row.convertedInWindow && <><span className={styles.dotSep}>•</span><span className={styles.convertedTag}>Signed up / in during this window</span></>}
                              {p?.open && (
                                <>
                                  <span className={styles.dotSep}>•</span>
                                  <span className={styles.liveReadingTag}>
                                    <span className={styles.livePulsingDot} aria-hidden="true" />
                                    Reading now
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.compactTopRight}>
                          {isLive ? (
                            <div className={styles.compactLiveBadge}>
                              <span className={styles.livePulseRing} aria-hidden="true" />
                              <span className={styles.livePulseCenter} aria-hidden="true" />
                              <span className={styles.liveBadgeText}>LIVE ON SITE</span>
                              <span className={styles.liveBadgeSub}>
                                {heartbeats ? "Page open now" : "Active now"}
                              </span>
                            </div>
                          ) : (
                            <div className={styles.compactDepartedBadge}>
                              <LogOut size={11} aria-hidden="true" />
                              <span>Left {since(row.left, clockNow)}</span>
                              <small className={styles.departedVerified} title={row.beacon ? "The page sent a leave beacon as it closed" : "No leave beacon arrived (closed tab, lost network); the time is the last activity seen"}>
                                {row.beacon ? "✓ Leave beacon (exact)" : "Estimated from last activity"}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Meaningful 3-Column Command Grid */}
                      <div className={styles.compact3Cols}>
                        {/* Column 1: Learner Origin & Client Environment (Lavender Tone) */}
                        <div className={`${styles.compactCol} ${styles.colOrigin}`}>
                          <div className={styles.colKicker}>
                            <Globe2 size={12} className={styles.colKickerIcon} aria-hidden="true" />
                            <span>Learner Origin & Environment</span>
                            <span className={styles.colKickerPill}>Client</span>
                          </div>
                          <div className={styles.colBody}>
                            <div className={styles.originGeoRow}>
                              <Flag code={code} />
                              <div className={styles.originGeoDetails}>
                                <strong className={styles.originCountryName} title={cleanCountry || "Country not resolved"}>
                                  {cleanCountry || "Country not resolved"}
                                </strong>
                                <span className={styles.originCityText} title={place || "City not resolved from the network"}>
                                  {place || "City not resolved from the network"}
                                </span>
                              </div>
                            </div>

                            <div className={styles.originBadgeRow}>
                              {pin ? (
                                <span className={styles.pinBadge} title={`Locality PIN from the network: ${pin}`}>
                                  <MapPin size={10} aria-hidden="true" /> PIN {pin}
                                </span>
                              ) : rawPin ? (
                                <span className={styles.pinEmpty} title={`${rawPin} is the city's head post office: the network resolved only to the city`}>City PIN {rawPin}</span>
                              ) : (
                                <span className={styles.pinEmpty} title="The network did not resolve a PIN">PIN not resolved</span>
                              )}
                              <span className={styles.algoTag} title="From the visitor's IP address: VPNs, offices and mobile carriers can place someone in another city">IP-based · approximate</span>
                            </div>

                            <div className={styles.clientSpecsGrid}>
                              <div className={styles.clientSpecItem} title={[v.device, v.browser, v.os].filter(Boolean).join(" · ") || "Browser not reported"}>
                                <Device size={11} aria-hidden="true" />
                                <span>{[v.browser, v.os].filter(Boolean).join(" · ") || "Browser not reported"}</span>
                              </div>
                              <div className={styles.clientSpecItem} title={v.screen ? `Screen ${v.screen} px` : "Screen size not reported"}>
                                <Monitor size={11} aria-hidden="true" />
                                <span>{v.screen ? `${v.screen} px` : "Screen not reported"}</span>
                              </div>
                              <div className={styles.clientSpecItem} title={language ? `Browser language ${language}` : "Language not reported"}>
                                <Languages size={11} aria-hidden="true" />
                                <span>{language ? `${languageName(language)} (${language})` : "Language not reported"}</span>
                              </div>
                              <div className={styles.clientSpecItem} title={(v.timezone ?? row.first.timezone) ? `Device time zone ${v.timezone ?? row.first.timezone}${local?.offset ? ` (${local.offset})` : ""}` : "Time zone not reported"}>
                                <Clock size={11} aria-hidden="true" />
                                <span>{v.timezone ?? row.first.timezone ?? "Time zone not reported"}</span>
                              </div>
                              {v.device && <div className={styles.clientSpecItem} title="Device class from the browser's user agent">
                                <Device size={11} aria-hidden="true" />
                                <span>{v.device.charAt(0).toUpperCase() + v.device.slice(1)}</span>
                              </div>}
                              {v.ip_masked && <div className={styles.clientSpecItem} title="Network address with its last part masked">
                                <Network size={11} aria-hidden="true" />
                                <span>{v.ip_masked}</span>
                              </div>}
                            </div>

                            {local && <p className={styles.localTime} title="The visitor's own clock, from the time zone their browser reported">
                              <Clock size={10} aria-hidden="true" /> Their local time: <b>{local.text}</b> · {local.part}{local.offset ? ` · ${local.offset}` : ""}
                            </p>}
                            {language && !/^en\b/i.test(language) && <p className={styles.langNote}>Browser prefers {languageName(language)}: the site is English-only for now.</p>}

                            <div className={styles.trafficSourceRow}>
                              <span className={styles.sourceBadge} title={row.source ? `Traffic source of this visit: ${row.source}` : "No referrer or campaign: typed, bookmarked or opened from an app"}>
                                <Link2 size={10} aria-hidden="true" /> {row.source ? `via ${row.source}` : "Direct / no referrer"}
                              </span>
                              {row.campaign && <span className={styles.sourceBadge} title="utm_medium · utm_campaign of the visit's first page">Campaign: {row.campaign}</span>}
                            </div>

                          </div>
                        </div>

                        {/* Column 2: Session Timeline & Precision IST (Sage/Mint Tone) */}
                        <div className={`${styles.compactCol} ${styles.colTimeline}`} role="group" aria-label="Session timeline">
                          <div className={styles.colKicker}>
                            <Clock size={12} className={styles.colKickerIcon} aria-hidden="true" />
                            <span>Session Timeline (IST & Duration)</span>
                            <span className={styles.colKickerPill}>IST UTC+5:30</span>
                          </div>
                          <div className={styles.colBody}>
                            <div className={styles.timelineTimesGrid}>
                              <div className={styles.timelineTimeCell} title="Estimated first page opening from recorded views and visible durations in the loaded window; network delay can affect this time">
                                <span className={styles.cellLabel}>
                                  <LogIn size={10} aria-hidden="true" /> Arrived (IST)
                                </span>
                                <time className={styles.clockValue} dateTime={row.sessionArrived}>
                                  {clock(row.sessionArrived)}
                                </time>
                                <small className={styles.dateValue}>
                                  {dayOf(row.sessionArrived)} · {since(row.sessionArrived, clockNow)}
                                </small>
                                <small className={styles.dateValue}>Estimated arrival</small>
                              </div>

                              <div className={`${styles.timelineTimeCell} ${row.left == null ? styles.timelineTimeCellLive : ""}`}>
                                <span className={styles.cellLabel}>
                                  {row.left == null ? <Radio size={10} aria-hidden="true" /> : <LogOut size={10} aria-hidden="true" />}
                                  {row.left == null ? "Status (IST)" : row.beacon ? "Left / hidden (IST)" : "Last seen (IST)"}
                                </span>
                                {row.left == null ? (
                                  <div className={styles.liveCellStatus}>
                                    <span className={styles.livePulseRingSmall} aria-hidden="true" />
                                    <strong>Recently active</strong>
                                  </div>
                                ) : (
                                  <time className={styles.clockValue} dateTime={new Date(row.left).toISOString()}>
                                    {clock(row.left)}
                                  </time>
                                )}
                                <small className={styles.dateValue}>
                                  {row.left == null ? (heartbeats ? "Page open now" : "Active now") : `${dayOf(row.left)} · ${since(row.left, clockNow)}`}
                                </small>
                                {row.left != null && <small className={styles.dateValue}>{row.beacon ? "Visibility ended; exit unconfirmed" : "Departure not confirmed"}</small>}
                              </div>
                            </div>

                            <div className={styles.stayMetricBlock}>
                              <div className={styles.stayHighlightRow}>
                                <div>
                                  <small className={styles.stayLabel} title="This visit, from the moment its first page opened to now while a page is open, otherwise to its last leave beacon or heartbeat">Total Stay</small>
                                  <strong className={styles.stayValue}>{spent(visit.stayMs / 1000)}</strong>
                                </div>
                                <div>
                                  <small className={styles.stayLabel} title="Time this visit's pages were on screen and visible, the open page included. Two windows open at once count once">Active Reading</small>
                                  <strong className={styles.readingValue}>{spent(visit.readingMs / 1000)}</strong>
                                </div>
                                <div>
                                  <small className={styles.stayLabel} title="Total Stay minus recorded visible time. This may include hidden tabs, loading, or missing tracking signals">Unobserved time</small>
                                  <strong className={styles.stayValue}>{spent(visit.awayMs / 1000)}</strong>
                                </div>
                              </div>

                              <small className={styles.timingNote}>{TIMING_NOTE[visit.timing]}</small>
                            </div>
                            {row.visits.length > 1 && <p className={styles.stayAll} title="Each visit's stay and reading, added up; time between visits is not counted">
                              All {row.visits.length} visits ({streamDays === 1 ? "24 h" : `${streamDays} days`}): <b>{spent(row.totalStayDurationMs / 1000)}</b> stay · <b>{spent(row.totalReadingMs / 1000)}</b> reading
                            </p>}
                          </div>
                        </div>

                        {/* Column 3: Active Target & Learning Journey (Sky Tone) */}
                        <div className={`${styles.compactCol} ${styles.colLearning}`}>
                          <div className={styles.colKicker}>
                            <Target size={12} className={styles.colKickerIcon} aria-hidden="true" />
                            <span>Active Target & Learning Journey</span>
                            <span className={styles.colKickerPill}>Step {row.currentStep.step}/{row.currentStep.total}</span>
                          </div>
                          <div className={styles.colBody}>
                            <div className={styles.stageRow}>
                              <span className={styles.stageBadge} title="How far along the site this person got, from the pages they opened">{row.stage}</span>
                              <small>{visit.pages} {visit.pages === 1 ? "page" : "pages"} · {visit.clicks} {visit.clicks === 1 ? "click" : "clicks"} this visit</small>
                            </div>
                            {row.signals.length > 0 && <ul className={styles.signalList}>{row.signals.map(signal => <li key={signal}>{signal}</li>)}</ul>}

                            <div className={styles.activeTargetBlock}>
                              <div className={styles.targetHeaderLine}>
                                <span className={styles.targetCategoryBadge}>{row.currentStep.category}</span>
                                {isLive && (
                                  <span className={styles.targetLiveIndicator}>
                                    <span className={styles.livePulsingDot} aria-hidden="true" />
                                    Active Target
                                  </span>
                                )}
                              </div>
                              <strong className={styles.targetTitle} title={row.currentStep.title}>
                                {row.currentStep.title}
                              </strong>
                              <code className={styles.targetPath} title={v.path}>
                                {v.path}
                              </code>
                            </div>

                            <div className={styles.journeyHead}><span>This visit, step by step</span><small className={styles.velocityText}>{row.readingVelocity}</small></div>
                            <ol className={styles.journeySteps}>
                              {steps.slice(-6).map((step, i, shown) => {
                                const number = steps.length - shown.length + i + 1;
                                return <li key={`${step.path}-${step.at}`} data-open={step.open || undefined}>
                                  <span className={styles.stepNo}>{number}</span>
                                  <div className={styles.stepBody}>
                                    <strong title={step.path}>{step.title}</strong>
                                    <small>{step.category} · {clock(step.at)} · {step.open ? "reading now" : step.ms == null ? "time not recorded" : spent(step.ms / 1000)}</small>
                                    {step.clicks.length > 0 && <small className={styles.stepClicks} title={step.clicks.map(c => `${c.option}${c.topic ? ` (in ${c.topic})` : ""}${c.target_path ? ` → ${c.target_path}` : ""}`).join("\n")}>
                                      <MousePointerClick size={9} aria-hidden="true" /> {step.clicks.slice(0, 3).map(c => `"${c.option}"`).join(", ")}{step.clicks.length > 3 ? ` +${step.clicks.length - 3}` : ""}
                                    </small>}
                                  </div>
                                </li>;
                              })}
                            </ol>
                            {steps.length > 6 && <small className={styles.moreSteps}>{steps.length - 6} earlier {steps.length - 6 === 1 ? "step" : "steps"} in this visit, from {steps[0].title}</small>}

                            {visit.categories.length > 0 && <div className={styles.categoryBars} aria-label="Time by kind of content this visit">
                              {visit.categories.slice(0, 3).map(c => {
                                const share = visit.readingMs ? Math.min(100, Math.round((c.ms / visit.readingMs) * 100)) : 0;
                                return <div key={c.category} className={styles.catRow} title={`${c.category}: ${spent(c.ms / 1000)} on ${c.pages} ${c.pages === 1 ? "page" : "pages"}`}>
                                  <span>{c.category}</span><i style={{ width: `${Math.max(4, share)}%` }} aria-hidden="true" /><b>{spent(c.ms / 1000)}</b>
                                </div>;
                              })}
                            </div>}

                            <p className={styles.entryExit}>Entered on <code>{visit.entry}</code>{visit.exit && <> · left from <code>{visit.exit}</code></>}</p>

                            {row.engagedContents.length > 1 && <div className={styles.engagedPagesMiniList}>
                              <div className={styles.miniListHeading}><span>Most-read across all visits</span></div>
                              {row.engagedContents.slice(0, 2).map((item, idx) => (
                                <div key={`${item.path}-${idx}`} className={styles.miniPageItem}>
                                  <div className={styles.miniPageTop}>
                                    <span className={styles.miniPageBadge}>{item.category}</span>
                                    <span className={styles.miniPageTime}>{spent(item.durationMs / 1000)}{item.views > 1 ? ` · ${item.views} views` : ""}</span>
                                  </div>
                                  <div className={styles.miniPageTitleLine}>
                                    <BookOpen size={10} className={styles.miniPageIcon} aria-hidden="true" />
                                    <span className={styles.miniPageTitle}>{item.title}</span>
                                  </div>
                                </div>
                              ))}
                            </div>}

                            {earlier.length > 0 && <details className={styles.earlierVisits}>
                              <summary>Earlier visits ({earlier.length})</summary>
                              <ul>{earlier.map(other => <li key={other.sessionId}>
                                <b>{dayOf(other.start)}, {clock(other.start)}</b> · {other.pages} {other.pages === 1 ? "page" : "pages"} · {spent(other.stayMs / 1000)} stay · {spent(other.readingMs / 1000)} reading
                                <small>Entered on {other.entry}{other.source ? ` via ${other.source}` : ""}</small>
                              </li>)}</ul>
                            </details>}
                          </div>
                        </div>
                      </div>

                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </> : <p className={styles.empty}>{everyone.length ? "No visitors match this filter." : report || stream ? `No page views recorded in ${streamDays === 1 ? "the last 24 hours" : `the last ${streamDays} days`} yet.` : "Connecting to live tracking…"}</p>}
        <Pager page={Math.min(visitPage, pagesOf(visitors, STREAM_PAGE))} pages={pagesOf(visitors, STREAM_PAGE)} total={visitors.length} size={STREAM_PAGE} onPage={setVisitPage} />
        {stream && !heartbeats && <p className={styles.streamNote}>Live status is estimated: apply migration 0034 (page heartbeats) so a visitor counts as on the site only while their page is open, timed to the second. Until then a page without a leave beacon counts as open for up to 30 minutes.</p>}
        {stream?.capped && <p className={styles.streamNote}>Showing the newest 20,000 events of the window; older visitors are left out.</p>}
      </article>

      {/* Anonymous visitors whose whole stay is one page view, from the same visitor list as the stream above. */}
      <FirstLookVisitors everyone={everyone} now={clockNow} days={streamDays} />

      {/* Visitors in a private (incognito) window: reported by the browser, or inferred from a fresh cookie on a known device. */}
      <PrivateVisitors everyone={everyone} now={clockNow} days={streamDays} />

      <article className={`${styles.panel} ${styles.wide}`} data-tone="lavender">
        <h3><Route size={16} aria-hidden="true" />Request tracing
          <span className={styles.filters} role="group" aria-label="Trace filter">{TRACE_FILTERS.map(f => <button key={f.id} type="button" aria-pressed={traceFilter === f.id} onClick={() => { setTraceFilter(f.id); setTracePage(1); }}><f.icon size={12} aria-hidden="true" />{f.label}</button>)}</span>
        </h3>
        <dl className={styles.traceStats}>
          <div><dt>Requests</dt><dd>{n(snapshot?.requests.count)}</dd><small>in the reporting window</small></div>
          <div data-tone={snapshot?.requests.errors ? "warn" : "ok"}><dt>Error rate</dt><dd>{pct(snapshot?.requests.errors ?? 0, snapshot?.requests.count ?? 0)}</dd><small>{n(snapshot?.requests.errors)} failed · {n(traceStats.client)} 4xx · {n(traceStats.server)} 5xx shown</small></div>
          <div><dt>Latency p50 / p95</dt><dd>{traceStats.p50 == null ? "—" : `${n(traceStats.p50)} / ${n(snapshot?.requests.p95 == null ? traceStats.p95 : Math.round(snapshot.requests.p95))} ms`}</dd><small>avg {traceStats.avg == null ? "—" : `${n(traceStats.avg)} ms`}</small></div>
          <div data-tone={traceStats.slow ? "warn" : "ok"}><dt>Slowest</dt><dd>{traceStats.max == null ? "—" : `${n(traceStats.max)} ms`}</dd><small>{n(traceStats.slow)} request{traceStats.slow === 1 ? "" : "s"} took 1 s or more</small></div>
        </dl>
        {traceStats.routes.length > 0 && <div className={styles.routes}>
          <div className={`${styles.listHead} ${styles.routesHead}`} aria-hidden="true"><span>Busiest routes</span><span>Calls</span><span>Errors</span><span>Avg</span><span>Slowest</span></div>
          <ul>{traceStats.routes.map(r => <li key={r.route}><code title={`${[...r.methods].join(", ")} ${r.route}`}><b>{[...r.methods].join("·")}</b> {r.route}</code><span>{n(r.calls)}</span><span data-tone={r.errors ? "warn" : "ok"}>{r.errors ? `${n(r.errors)} (${pct(r.errors, r.calls)})` : "0"}</span><span>{n(r.avg)} ms</span><span>{n(r.slowest)} ms</span></li>)}</ul>
        </div>}
        {traces.length ? <><div className={`${styles.listHead} ${styles.tracesHead}`} aria-hidden="true"><span>Method</span><span>Route</span><span>Status</span><span>Duration</span><span>When</span></div><ol className={styles.traces}>{traceRows.map((e, i) => { const status = e.status == null ? null : Number(e.status); const ms = Number(e.duration_ms) || 0; const details = e.details as { request_id?: string; code?: string } | null; const id = details?.request_id, code = details?.code; return <li key={`${String(e.created_at)}-${i}`}>
          <span className={styles.method}>{String(e.action ?? "—")}</span>
          <code className={styles.path} title={String(e.resource ?? "")}>{String(e.resource ?? "—")}</code>
          <span className={styles.status} data-tone={statusTone(status)}>{status ?? "—"}</span>
          <span className={styles.duration}><i style={{ width: `${Math.max(3, (ms / slowest) * 100)}%` }} data-slow={ms >= 1000 || undefined} /><small>{ms ? `${n(ms)} ms` : "—"}</small></span>
          <time dateTime={String(e.created_at)} title={`${new Date(String(e.created_at)).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST${id ? ` · request ${id}` : ""}${code ? ` · ${code}` : ""}`}>{since(e.created_at, now)}{(id || code) && <small>{code ?? `#${String(id).slice(0, 8)}`}</small>}</time>
        </li>; })}</ol></> : <p className={styles.empty}>{requests.length ? "No requests match this filter." : "No API requests recorded in this window."}</p>}
        <Pager page={Math.min(tracePage, pagesOf(traces, TRACE_PAGE))} pages={pagesOf(traces, TRACE_PAGE)} total={traces.length} size={TRACE_PAGE} onPage={setTracePage} />
      </article>

      <article className={styles.panel} data-tone="peach">
        <h3><Zap size={16} aria-hidden="true" />{day === "today" ? "Today" : "Last 24 hours"}<span>page views by hour (IST){day === "today" ? " since midnight" : ""}, bots excluded{exact ? "" : " · from the database report until the visitor stream loads"}</span></h3>
        <div className={styles.spark} role="img" aria-label={`Hourly page views, peak ${n(peak)}`}>{hours.map((views, hour) => { return <span key={hour} style={{ height: `${Math.max(4, (views / peak) * 100)}%` }} data-now={istHour(clockNow) === hour || undefined} title={`${hourLabel(hour)} IST — ${views} page views`} />; })}</div>
        <div className={styles.sparkAxis}><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
        {(() => {
          const busiest = hours.reduce<{ hour: number; views: number } | null>((best, views, hour) => !best || views > best.views ? { hour, views } : best, null);
          const mobile = fig.devices.filter(d => /mobile|tablet/i.test(d.device)).reduce((sum, d) => sum + d.people, 0);
          const deviceTotal = fig.devices.reduce((sum, d) => sum + d.people, 0);
          const { topPage: page, topSource: source, topCountry: country } = fig;
          const facts: [string, string, string | undefined, LucideIcon][] = [
            ["Visitors", n(fig.people), `${n(fig.views)} page views`, Users],
            ["Visits", n(fig.sessions), fig.pagesPerSession == null ? undefined : `${fig.pagesPerSession} pages per visit`, Activity],
            ["Avg. visit length", fig.avgSessionSeconds == null ? "—" : spent(fig.avgSessionSeconds), fig.bounceRate == null ? undefined : `${fig.bounceRate}% left after one page`, Timer],
            ["New visitors", n(fig.newVisitors), fig.people ? `${pct(fig.newVisitors ?? 0, fig.people)} of visitors · first visit ever` : undefined, Sparkles],
            ["Signed-in learners", n(fig.signedIn), `${n(t?.newAccounts)} new accounts`, UserRound],
            ["Peak hour (IST)", busiest?.views ? hourLabel(busiest.hour) : "—", busiest?.views ? `${n(busiest.views)} page views` : undefined, Flame],
            ["Busiest page", page?.path ?? "—", page ? `${n(page.people)} visitors · ${n(page.views)} views · ${page.avgSeconds == null ? "no finished read yet" : `${spent(page.avgSeconds)} avg read`}` : undefined, BookOpenText],
            ["Top source", source?.name ?? "—", source ? `${n(source.people)} visitors` : undefined, Link2],
            ["Top country", country ? countryName(country.country) || country.country : "—", country ? `${n(country.people)} visitors` : undefined, Globe2],
            ["Mobile & tablet", deviceTotal ? pct(mobile, deviceTotal) : "—", deviceTotal ? `${n(mobile)} of ${n(deviceTotal)} visitors` : undefined, Smartphone],
            ["Bots filtered", n(t?.bots), "bot and automated visits, excluded from every figure", Bot],
          ];
          const tones = ["sky", "lavender", "mint", "peach", "butter", "rose", "sage"];
          return <dl className={styles.facts}>{facts.map(([label, value, note, Icon], i) => <div key={label} data-tone={tones[i % tones.length]} style={{ "--i": i } as React.CSSProperties}><dt><Icon size={12} aria-hidden="true" />{label}</dt><dd title={value}>{value}</dd>{note && <small>{note}</small>}</div>)}</dl>;
        })()}
      </article>

      <article className={styles.panel} data-tone="sky">
        <h3><BookOpenText size={16} aria-hidden="true" />Pages read, last 30 min<span>most visitors first · avg. read per finished page view</span></h3>
        {reading.length ? <><div className={`${styles.listHead} ${styles.readingHead}`} aria-hidden="true"><span>Page</span><span>Visitors</span><span>Views</span><span>Avg. read</span></div><ul className={styles.reading}>{readRows.map(p => <li key={p.path}><code title={`${p.title} · ${p.path}`}>{p.path}</code><span title="Different people"><Users size={12} aria-hidden="true" />{p.people}</span><span title="Times opened"><MousePointerClick size={12} aria-hidden="true" />{p.views}</span><span title={p.avgReadMs == null ? "Still open, or closed without a recorded time" : "Average visible time per finished view"}><Timer size={12} aria-hidden="true" />{p.avgReadMs == null ? "—" : spent(p.avgReadMs / 1000)}</span></li>)}</ul></> : <p className={styles.empty}>Nobody has opened a page in the last 30 minutes.</p>}
        {reading.length > READING_PAGE && <Pager page={Math.min(readPage, pagesOf(reading, READING_PAGE))} pages={pagesOf(reading, READING_PAGE)} total={reading.length} size={READING_PAGE} onPage={setReadPage} />}
        {devices.length > 0 && <div className={styles.devices}>{devices.map(({ device, people }) => { const Icon = DEVICE_ICON[device] ?? Laptop; return <span key={device}><Icon size={13} aria-hidden="true" />{device} <b>{people}</b></span>; })}<small>visitors in the last hour</small></div>}
      </article>

      <article className={styles.panel} data-tone="butter">
        <h3><Server size={16} aria-hidden="true" />System health<span>{h?.environment ?? ""}</span></h3>
        {h ? <dl className={styles.health}>
          <div><dt><Database size={13} aria-hidden="true" />Database</dt><dd data-tone={h.databaseMs > 800 ? "warn" : "ok"}>{n(h.databaseMs)} ms</dd></div>
          <div><dt><Cpu size={13} aria-hidden="true" />CPU</dt><dd>{h.cpuPercent == null ? `${h.cpuCores} cores` : `${Math.round(h.cpuPercent)}% · ${h.cpuCores} cores`}</dd></div>
          <div><dt><Gauge size={13} aria-hidden="true" />Process memory</dt><dd>{bytes(h.processMemory)}</dd></div>
          <div><dt><Server size={13} aria-hidden="true" />Host memory</dt><dd>{bytes(h.hostUsedMemory)} / {bytes(h.hostMemory)}</dd></div>
          <div><dt><Clock size={13} aria-hidden="true" />Uptime</dt><dd>{uptime(h.processUptime)}</dd></div>
          <div><dt><LogIn size={13} aria-hidden="true" />Runtime</dt><dd>{h.nodeVersion ?? "—"}</dd></div>
        </dl> : <p className={styles.empty}>Health appears once the monitoring snapshot loads.</p>}
      </article>
    </div>
    <p className={styles.note}><Globe2 size={13} aria-hidden="true" /> Request figures marked “shown” and the busiest routes come from the latest {n(requests.length)} logged requests; totals, error rate and p95 cover the whole window. Visits come from the first-party page beacon (bots excluded, IPs masked); traces come from the API request log, which never stores query strings, bodies or credentials. <UserRound size={13} aria-hidden="true" /> Emails show only for signed-in learners.</p>
  </section>;
}

export type ToneTile = { label: string; value: string; note: string; icon: LucideIcon; tone: string; pulse?: boolean };
/** The command centre's tinted metric tiles, for other admin sections (e.g. Live learners, Moderation). */
export function ToneTiles({ items }: { items: ToneTile[] }) {
  return <div className={`${styles.live} ${styles.tilesOnly}`}><div className={styles.kpis}>
    {items.map(({ label, value, note, icon: Icon, tone, pulse }) => <div key={label} className={styles.kpi} data-tone={tone}>
      <span className={styles.kpiIcon} aria-hidden="true">{pulse && <i className={styles.ring} />}<Icon size={16} /></span>
      <span className={styles.kpiLabel} title={label}>{label}</span><strong>{value}</strong><small>{note}</small>
    </div>)}
  </div></div>;
}
