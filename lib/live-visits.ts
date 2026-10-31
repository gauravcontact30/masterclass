/*
 * The Live visitor stream's arithmetic (components/super-admin-overview-live.tsx), kept pure so it can be tested to
 * the second. Inputs are site_visits rows (page_view and page_leave) and, after migration 0034, site_presence rows:
 * one heartbeat row per open page. components/visit-tracker.tsx defines what they mean:
 *  - a page's time is counted only while it is visible; each visible stretch ends with a leave beacon whose
 *    duration is that stretch, so a page view's time is the sum of its leave beacons;
 *  - while a page is visible it sends a heartbeat every 45 s (and once when a hidden tab comes back), recording
 *    when the current stretch began (`started_at`) and when it was last seen (`seen_at`).
 * A page is being read now while its heartbeat is fresh; its time is then the beacons so far plus the open stretch,
 * ticking. A page whose leave beacon never arrived (a crashed tab) is timed up to its last heartbeat.
 */
export type StreamVisit = {
  id?: number; created_at: string; event: string; visitor_id: string; session_id: string; user_id?: string | null; person?: string; email?: string | null;
  new_visitor?: boolean; path: string; title?: string | null; country?: string | null; city?: string | null; region?: string | null; postal_code?: string | null;
  device?: string | null; browser?: string | null; os?: string | null; duration_ms?: number | null; referrer_host?: string | null; utm_source?: string | null;
  utm_medium?: string | null; utm_campaign?: string | null;
  /** Keyed hash of the network and the reported screen: together with browser and OS, a device fingerprint. */
  ip_hash?: string | null; screen?: string | null;
  /** Reported by the browser with each page view; ip_masked is the network address with its last part hidden. */
  language?: string | null; timezone?: string | null; ip_masked?: string | null;
  /** The browser said this page was opened in a private window (lib/early-track.ts); null when it cannot tell. Migration 0048. */
  private_mode?: boolean | null;
};
export type Presence = { session_id: string; path: string; started_at: string; seen_at: string };
/** A tracked click (components/visit-tracker.tsx → monitor_events "site_interaction"): UI labels and paths only. */
export type StreamClick = { created_at: string; session_id: string; path: string; topic: string | null; option: string; target_path: string | null };

/** Heartbeats come every 45 s; one missed beat (a slow network, a throttled timer) is allowed before a page counts as closed. */
export const LIVE_MS = 100_000;
/**
 * Without heartbeats (before migration 0034) a page with no leave beacon counts as open for up to 30 minutes,
 * matching the session idle limit and legacy presence rules.
 */
export const LEGACY_OPEN_MS = 30 * 60_000;

export type PageTime = { ms: number; open: boolean };

export type EngagedContent = {
  path: string;
  title: string;
  category: string;
  durationMs: number;
  views: number;
};

/** One page of a visit, in the order it was opened. `ms` is its visible time; null when nothing is known (closed within seconds). */
export type JourneyStep = { path: string; title: string; category: string; at: number; ms: number | null; open: boolean; clicks: StreamClick[] };
/**
 * One visit (one session: it ends after 30 idle minutes, and is shared by every tab of the browser).
 *  - start: when its first page opened. The browser times that page from navigation start, a few seconds before the
 *    server stamps the view (the view is only sent once the page has been visible for a second), so this is the
 *    earlier of the two;
 *  - end: now while a page is open, otherwise the last signal (leave beacon or heartbeat) of any of its pages;
 *  - readingMs: the visible stretches of its pages merged, so two windows open side by side are not counted twice.
 *    It is never more than stayMs; the difference (awayMs) is time with the tab hidden, between pages or loading.
 */
export type VisitSummary = {
  sessionId: string; start: number; end: number; stayMs: number; readingMs: number; awayMs: number; open: boolean;
  views: number; pages: number; steps: JourneyStep[]; clicks: number;
  categories: { category: string; ms: number; pages: number }[];
  entry: string; exit: string | null; source: string | null; campaign: string | null;
  /** Beacons record visibility ending, not a confirmed browser/session exit. */
  timing: "recorded" | "partial" | "live";
};
export type JourneyStage = "Learner" | "Evaluating plans" | "Account holder" | "Signing up" | "Studying content" | "Browsing";
export type StreamVisitor = {
  key: string; email: string | null; first: StreamVisit; last: StreamVisit; current: StreamVisit; page: PageTime | null;
  views: number; pages: number; sessions: number; engagedMs: number; trail: string[]; source: string | null;
  arrived: string; lastAt: number; left: number | null; beacon: boolean; live: boolean; signedIn: boolean;
  /** The latest visit (session): arrival to now while on the site, otherwise to the last activity seen. */
  stayDurationMs: number;
  /** Visible time on the latest visit's pages, the open page's clock included: never more than stayDurationMs. */
  sessionEngagedMs: number;
  /** "detected": the browser reported a private window; "likely": a known device came back with a brand-new cookie. */
  privateWindow: PrivateSignal | null;
  postalCode: string | null;
  engagedContents: EngagedContent[];
  sessionArrived: string;
  firstArrived: string;
  totalStayDurationMs: number;
  focusRatio: number;
  intensityTier: "Deep Focus" | "Active Study" | "Exploring";
  readingVelocity: string;
  currentStep: { step: number; total: number; title: string; category: string };
  leftAlgorithm: "beacon" | "heartbeat" | "legacy" | "live";
  timeSpentAlgorithm: "beacon" | "heartbeat_live" | "hybrid" | "legacy";
  /** The visit shown on the card (the one with the latest activity), and every visit in the window, oldest first. */
  visit: VisitSummary;
  visits: VisitSummary[];
  /** Visible time over every visit in the window (each visit's merged stretches, added up). */
  totalReadingMs: number;
  /** How far along the site this person got, and the evidence for it. */
  stage: JourneyStage;
  signals: string[];
  /** Arrived anonymous and signed in or signed up later in the window. */
  convertedInWindow: boolean;
  campaign: string | null;
};

const at = (iso: string) => Date.parse(iso);

export type PrivateSignal = "detected" | "likely";
/** In-app browsers drop the visitor cookie on their own (see indexVisits), so a fresh cookie there says nothing about private windows. */
const IN_APP = / app$|WhatsApp|In-app browser/i;

/**
 * Whether these page views came from a private (incognito) window. Firefox and Safari report it directly
 * (private_mode, lib/early-track.ts); Chromium browsers hide it, so the fallback is the one trace a private window
 * leaves: a device already seen here (same network, browser, OS and screen) arriving with a brand-new visitor cookie
 * that it then keeps. Clearing cookies looks the same, which is why that case is only "likely".
 */
export function privateSignal(views: StreamVisit[]): PrivateSignal | null {
  if (views.some(view => view.private_mode === true)) return "detected";
  const seen = new Map<string, string>();
  for (const view of views) {
    if (!view.ip_hash || !view.screen || IN_APP.test(view.browser ?? "")) continue;
    const device = `${view.ip_hash}|${view.browser}|${view.os}|${view.screen}`, earlier = seen.get(device);
    if (earlier && earlier !== view.visitor_id && view.new_visitor && view.private_mode !== false) return "likely";
    if (!earlier) seen.set(device, view.visitor_id);
  }
  return null;
}

/** What one page view is known to have: its closed stretches, and the stretch still running when there is one. */
type ViewFacts = { from: number; stretches: [number, number][]; beaconMs: number; lastLeave: number | null; beacons: number; partial: boolean; running: { since: number; seen: number; heartbeat: boolean } | null; legacyOpen: boolean };
type Person = { key: string; user: string | null; email: string | null; views: StreamVisit[]; lastEvent: number };
export type VisitIndex = { facts: Map<StreamVisit, ViewFacts>; people: Person[]; clicks: Map<string, StreamClick[]> };

/** The part that depends only on the rows: run when the data changes, not on every tick of the clock. */
export function indexVisits(rows: StreamVisit[], presence: Presence[] | null, clickRows: StreamClick[] = []): VisitIndex {
  // One browser's visits before and after signing in are one person.
  const linked = new Map<string, string>();
  for (const row of rows) if (row.user_id && !linked.has(row.visitor_id)) linked.set(row.visitor_id, row.user_id);
  // In-app browsers (LinkedIn, Google app, Facebook) often drop the visitor cookie, so one anonymous person arrives as a
  // new visitor id on every page. Ids that share a device fingerprint (network, browser, OS, screen) are one visitor.
  // Only page views report the screen, so a visitor id takes the fingerprint of its views for its leave beacons too.
  const fingerprint = new Map<string, string>();
  for (const row of rows) if (row.event === "page_view" && row.ip_hash && row.screen && !fingerprint.has(row.visitor_id)) fingerprint.set(row.visitor_id, `${row.ip_hash}|${row.browser}|${row.os}|${row.screen}`);
  const beats = new Map((presence ?? []).map(p => [`${p.session_id}|${p.path}`, p]));
  const byPage = new Map<string, StreamVisit[]>(), byPerson = new Map<string, StreamVisit[]>(), latestView = new Map<string, number>();
  for (const row of rows) {
    if (row.event !== "page_view" && row.event !== "page_leave") continue;
    const page = `${row.session_id}|${row.path}`, person = row.user_id || linked.get(row.visitor_id) || (fingerprint.has(row.visitor_id) ? `device:${fingerprint.get(row.visitor_id)}` : row.person || `visitor:${row.visitor_id}`);
    (byPage.get(page) ?? byPage.set(page, []).get(page)!).push(row);
    (byPerson.get(person) ?? byPerson.set(person, []).get(person)!).push(row);
    if (row.event === "page_view") latestView.set(row.session_id, Math.max(latestView.get(row.session_id) ?? 0, at(row.created_at)));
  }

  // Each page view owns the leave beacons of its session and path until that path's next view in the session.
  const facts = new Map<StreamVisit, ViewFacts>();
  for (const [key, list] of byPage) {
    list.sort((a, b) => at(a.created_at) - at(b.created_at) || (a.event === "page_view" ? -1 : 1));
    let view: StreamVisit | null = null, entry: ViewFacts | null = null;
    const close = (isLast: boolean) => {
      if (!view || !entry) return;
      if (isLast) {
        const beat = beats.get(key), seen = beat ? at(beat.seen_at) : NaN;
        // A heartbeat after the last leave beacon is a visible stretch that has not ended (or whose beacon was lost).
        // Its start is the browser's own (started_at): a page's first stretch begins before the server stamped the view,
        // at navigation start for the page load and a second earlier for a client-side route, so it is not cut at `from`
        // (that made an open page's clock jump by several seconds when it closed and its leave beacon arrived).
        if (beat && Number.isFinite(at(beat.started_at)) && seen >= at(beat.started_at) && seen >= entry.from && seen > (entry.lastLeave ?? -Infinity)) entry.running = { since: Math.max(at(beat.started_at), entry.lastLeave ?? entry.from - EARLY_START_MS), seen, heartbeat: true };
        else if (presence && entry.lastLeave == null) entry.running = { since: entry.from, seen: entry.from, heartbeat: false };
        entry.legacyOpen = !presence && entry.lastLeave == null && latestView.get(view.session_id) === entry.from;
      }
      facts.set(view, entry);
    };
    for (const row of list) {
      if (row.event === "page_view") { close(false); view = row; entry = { from: at(row.created_at), stretches: [], beaconMs: 0, lastLeave: null, beacons: 0, partial: false, running: null, legacyOpen: false }; }
      else if (entry) {
        const duration = Number(row.duration_ms), end = at(row.created_at);
        // A malformed or overlapping duration must not move arrival arbitrarily backwards or count time twice.
        const ms = Number.isFinite(duration) ? Math.max(0, duration) : 0;
        const start = Math.max(end - ms, entry.lastLeave ?? entry.from - EARLY_START_MS);
        if (end > start) entry.stretches.push([start, end]);
        entry.beaconMs += Math.max(0, end - start);
        if (row.duration_ms == null || !Number.isFinite(duration) || duration < 0 || start > end - ms) entry.partial = true;
        entry.lastLeave = end; entry.beacons++;
      }
    }
    close(true);
  }

  const people = [...byPerson].flatMap(([key, list]) => {
    const views = list.filter(row => row.event === "page_view").sort((a, b) => at(a.created_at) - at(b.created_at));
    if (!views.length) return [];
    const user = list.map(row => row.user_id || linked.get(row.visitor_id)).find(Boolean) ?? null;
    return [{ key, user, email: list.find(row => row.email)?.email ?? null, views, lastEvent: Math.max(...list.map(row => at(row.created_at))) }];
  });
  const clicks = new Map<string, StreamClick[]>();
  for (const click of clickRows) (clicks.get(click.session_id) ?? clicks.set(click.session_id, []).get(click.session_id)!).push(click);
  for (const list of clicks.values()) list.sort((a, b) => at(a.created_at) - at(b.created_at));
  return { facts, people, clicks };
}

/** How long before its server stamp a page's first visible stretch may have begun (navigation start, hydration, the 1 s minimum). */
const EARLY_START_MS = 60_000;

/** A page view's visible stretches at `now` as [start, end] times: its leave beacons, plus the stretch still running. */
function viewStretches(facts: ViewFacts | undefined, now: number): [number, number][] {
  if (!facts) return [];
  if (facts.running) {
    const end = now - facts.running.seen < LIVE_MS ? now : facts.running.seen;
    return end > facts.running.since ? [...facts.stretches, [facts.running.since, end]] : facts.stretches;
  }
  if (facts.legacyOpen && now - facts.from < LEGACY_OPEN_MS) return [[facts.from, now]];
  return facts.stretches;
}

/** Overlapping stretches merged: their total length and outer bounds. */
function merged(stretches: [number, number][]): { ms: number; start: number | null; end: number | null } {
  const sorted = [...stretches].sort((a, b) => a[0] - b[0]);
  let ms = 0, start: number | null = null, end: number | null = null, runStart = 0, runEnd = -Infinity;
  for (const [s, e] of sorted) {
    if (start == null || s < start) start = s;
    if (end == null || e > end) end = e;
    if (s > runEnd) { if (runEnd > runStart) ms += runEnd - runStart; runStart = s; runEnd = e; } else runEnd = Math.max(runEnd, e);
  }
  if (runEnd > runStart) ms += runEnd - runStart;
  return { ms, start, end };
}

/** A page view's time at `now`, and whether it is being read; null when nothing is known about how long it was read. */
export function pageTime(facts: ViewFacts | undefined, now: number): (PageTime & { lastSignal: number; beacon: boolean }) | null {
  if (!facts) return null;
  let ms = facts.beaconMs, open = false, lastSignal = facts.lastLeave ?? facts.from;
  if (facts.running) {
    open = now - facts.running.seen < LIVE_MS;
    ms += Math.max(0, (open ? now : facts.running.seen) - facts.running.since);
    lastSignal = Math.max(lastSignal, facts.running.seen);
  } else if (facts.legacyOpen && now - facts.from < LEGACY_OPEN_MS) {
    open = true; ms = now - facts.from;
  }
  // A view with no beacon whose heartbeat never came (a tab closed within seconds) has no known time.
  if (!open && !facts.beacons && !(facts.running?.heartbeat)) return null;
  return { ms, open, lastSignal, beacon: !open && facts.lastLeave != null && facts.lastLeave >= lastSignal };
}

export function getLearningCategory(path: string): string {
  const p = path.toLowerCase().split(/[?#]/)[0];
  if (p === "/" || p === "") return "Landing page";
  if (/^\/tech-buzz\/.+/.test(p)) return "Tech Buzz article";
  if (p.startsWith("/tech-buzz")) return "Tech Buzz feed";
  if (p.startsWith("/api-reference")) return "API Reference";
  if (p.startsWith("/compare")) return "Tool comparison";
  if (p.startsWith("/courses")) return "Course catalogue";
  if (p.startsWith("/subscribe") || p.startsWith("/checkout") || p.startsWith("/pricing")) return "Plans & checkout";
  if (/^\/(sign-in|sign-up|reset-password|auth)(\/|$)/.test(p)) return "Account access";
  if (/^\/(about|contact)(\/|$)/.test(p)) return "About & contact";
  if (/^\/(privacy|terms|refund|legal)/.test(p)) return "Legal";
  if (p.includes("/techy")) return "Tech Deep-Dive";
  if (p.includes("/workflow")) return "Agentic Workflow";
  if (p.includes("/lessons") || p.includes("/learn")) return "Lesson / Track";
  if (p.includes("/api-docs") || p.includes("/official-docs")) return "API & Docs";
  if (p.includes("/quiz")) return "Quiz & Assessment";
  if (p.includes("/interview")) return "Interview Prep";
  if (p.includes("/notes") || p.includes("/notepad")) return "Notes & Notepad";
  if (p.includes("/certifications")) return "Certification";
  if (p.includes("/coffee-and-code")) return "Coffee & Code";
  if (p.includes("/bookmark")) return "Bookmarks";
  if (p.includes("/step-by-step")) return "Step-by-Step";
  if (p.includes("/vocabs") || p.includes("/vocabulary")) return "Vocabularies";
  if (p.includes("/learning") || p.includes("/dashboard")) return "Learning Dashboard"; // /dashboard: visits before the 2026-10-25 move
  return "General";
}

export function getCleanTitle(title: string | null | undefined, path: string): string {
  if (title) {
    const cleaned = title.replace(/\s*[-|·•]\s*(Masterclass|Master Class|Platform).*$/i, "").replace(/\s+(Masterclass|Platform)$/i, "").trim();
    if (cleaned.length > 0 && cleaned !== "Masterclass") return cleaned;
  }
  const parts = path.split("/").filter(Boolean);
  const last = parts.at(-1) || "Home";
  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Whether a visitor spent at least a second on the site: their recorded visible time, or the open page's clock while
 * they are still here. Visitors under a second are not shown anywhere in Super Admin (user rule 2026-10-27). It used to
 * accept any visitor with a page view, which is every visitor, so 0-second visitors were never filtered out.
 */
export function isEngagedVisitor(v: { engagedMs: number; page?: { ms: number } | null }): boolean {
  return Math.max(v.engagedMs, v.page?.ms ?? 0) >= 1000;
}

/**
 * One row per visitor (the signed-in person, or the anonymous browser), most recently active first. `emails` maps account ids to emails for visitors whose rows did not carry one.
 * Visitors with under a second of engagement are left out unless `filterZeroSeconds` is false.
 */
export function streamVisitors(index: VisitIndex, now: number, emails: Record<string, string> = {}, filterZeroSeconds = true): StreamVisitor[] {
  const list = index.people.map(person => {
    const { views } = person, first = views[0], last = views.at(-1)!;
    const times = views.map(view => ({ view, time: pageTime(index.facts.get(view), now) }));
    const openNow = times.filter(t => t.time?.open).at(-1);
    const lastAt = Math.max(person.lastEvent, ...times.map(t => t.time?.lastSignal ?? 0));
    const signalAt = (t: typeof times[number]) => t.time?.lastSignal ?? at(t.view.created_at);
    const latest = times.reduce<typeof times[number] | null>((best, t) => !best || signalAt(t) >= signalAt(best) ? t : best, null);

    // Every visit (session) in the window, oldest first, each timed from its own pages' stretches.
    const sessionIds = [...new Set(views.map(view => view.session_id))];
    const visits = sessionIds.map(id => summarizeVisit(id, times.filter(t => t.view.session_id === id), index, now));
    // The card's visit is the one being read now, otherwise the one with the latest activity. It used to be the session
    // of the last page view, which with two tabs could differ from the open page's, mixing two visits on one card.
    const visitId = openNow?.view.session_id ?? latest?.view.session_id ?? last.session_id;
    const visit = visits.find(v => v.sessionId === visitId) ?? visits.at(-1)!;
    const session = views.filter(view => view.session_id === visit.sessionId);
    const current = openNow?.view ?? session.at(-1) ?? last, currentTime = times.find(t => t.view === current)?.time;
    const trail = session.map(view => view.path).filter((path, i, all) => path !== all[i - 1]).slice(-4);

    const stayDurationMs = visit.stayMs, sessionEngagedMs = visit.readingMs;
    const totalStayDurationMs = visits.reduce((sum, v) => sum + v.stayMs, 0);
    const totalReadingMs = visits.reduce((sum, v) => sum + v.readingMs, 0);
    const postalCode = views.map(v => v.postal_code).find(Boolean) ?? null;

    const contentMap = new Map<string, EngagedContent>();
    for (const { view, time } of times) {
      const p = view.path || "/";
      const existing = contentMap.get(p) ?? { path: p, title: getCleanTitle(view.title, p), category: getLearningCategory(p), durationMs: 0, views: 0 };
      existing.durationMs += Math.max(0, time?.ms ?? 0);
      existing.views += 1;
      contentMap.set(p, existing);
    }
    const engagedContents = [...contentMap.values()].sort((a, b) => b.durationMs - a.durationMs || b.views - a.views);

    // Merged per visit, so a page open in two windows at once is counted once.
    const engagedMs = totalReadingMs;
    const focusRatio = stayDurationMs > 0 ? Math.min(100, Math.round((sessionEngagedMs / stayDurationMs) * 100)) : 0;
    let intensityTier: "Deep Focus" | "Active Study" | "Exploring" = "Exploring";
    if (focusRatio >= 70 && sessionEngagedMs >= 120_000) intensityTier = "Deep Focus";
    else if (sessionEngagedMs >= 45_000 || (focusRatio >= 40 && sessionEngagedMs >= 15_000)) intensityTier = "Active Study";
    const timedPages = visit.steps.filter(step => step.ms != null).length;
    const readingVelocity = timedPages ? `${Math.max(1, Math.round(sessionEngagedMs / 1000 / timedPages))}s / page` : "—";

    const currentStepIndex = session.indexOf(current);
    const currentStep = {
      step: currentStepIndex >= 0 ? currentStepIndex + 1 : session.length,
      total: session.length,
      title: getCleanTitle(current.title, current.path),
      category: getLearningCategory(current.path),
    };

    let leftAlgorithm: "beacon" | "heartbeat" | "legacy" | "live" = "live";
    if (openNow) leftAlgorithm = "live";
    else if (latest?.time?.beacon) leftAlgorithm = "beacon";
    else if (latest && index.facts.get(latest.view)?.running?.heartbeat) leftAlgorithm = "heartbeat";
    else leftAlgorithm = "legacy";

    const hasBeacon = times.some(t => (index.facts.get(t.view)?.beaconMs ?? 0) > 0);
    const timeSpentAlgorithm: "beacon" | "heartbeat_live" | "hybrid" | "legacy" = openNow ? (hasBeacon ? "hybrid" : "heartbeat_live") : hasBeacon ? "beacon" : "legacy";

    const signedIn = Boolean(person.user);
    const { stage, signals } = journeyStage(views, visits, signedIn);
    const convertedInWindow = signedIn && !views[0].user_id && views.some(view => view.user_id);
    const campaign = visit.campaign ?? visits.map(v => v.campaign).find(Boolean) ?? null;

    return {
      key: person.key, email: (person.user && emails[person.user]) || person.email, first, last, current,
      page: currentTime ? { ms: currentTime.ms, open: currentTime.open } : null, views: views.length, pages: new Set(views.map(view => view.path)).size,
      sessions: sessionIds.length, engagedMs,
      trail, source: visit.source,
      arrived: first.created_at, lastAt, left: visit.open ? null : visit.end, beacon: !openNow && Boolean(latest?.time?.beacon),
      live: Boolean(openNow), signedIn,
      stayDurationMs,
      sessionEngagedMs,
      privateWindow: privateSignal(views),
      postalCode,
      engagedContents,
      sessionArrived: new Date(visit.start).toISOString(),
      firstArrived: new Date(visits[0].start).toISOString(),
      totalStayDurationMs,
      focusRatio,
      intensityTier,
      readingVelocity,
      currentStep,
      leftAlgorithm,
      timeSpentAlgorithm,
      visit, visits, totalReadingMs, stage, signals, convertedInWindow, campaign,
    };
  // Most recent first: a visitor with a page open is active now (their last heartbeat can be up to 45 s old, which
  // used to shuffle live cards on every refresh); ties go to whoever arrived last, so the newest arrival is #1.
  }).sort((a, b) => (b.live ? now : b.lastAt) - (a.live ? now : a.lastAt) || Date.parse(b.sessionArrived) - Date.parse(a.sessionArrived));

  return filterZeroSeconds ? list.filter(isEngagedVisitor) : list;
}

/** One session's pages, timed and in order, with what was clicked on each. */
function summarizeVisit(sessionId: string, times: { view: StreamVisit; time: ReturnType<typeof pageTime> }[], index: VisitIndex, now: number): VisitSummary {
  const stretches = times.flatMap(t => viewStretches(index.facts.get(t.view), now));
  const union = merged(stretches);
  const arrived = at(times[0].view.created_at);
  const open = times.some(t => t.time?.open);
  const lastSignal = Math.max(...times.map(t => t.time?.lastSignal ?? at(t.view.created_at)));
  const start = Math.min(arrived, union.start ?? arrived);
  const end = open ? Math.max(now, start) : Math.max(lastSignal, union.end ?? 0, arrived);
  const stayMs = Math.max(0, end - start), readingMs = Math.min(union.ms, stayMs);

  // Each click belongs to the latest page of the same path opened before it (a second of slack for the server stamps).
  const clicks = index.clicks.get(sessionId) ?? [];
  const steps: JourneyStep[] = times.map(({ view, time }) => ({
    path: view.path, title: getCleanTitle(view.title, view.path), category: getLearningCategory(view.path),
    at: at(view.created_at), ms: time ? time.ms : null, open: Boolean(time?.open), clicks: [],
  }));
  for (const click of clicks) {
    const when = at(click.created_at);
    const owner = [...steps].reverse().find(step => step.path === click.path && step.at <= when + 1000) ?? [...steps].reverse().find(step => step.at <= when + 1000);
    owner?.clicks.push(click);
  }

  const byCategory = new Map<string, { category: string; ms: number; pages: Set<string> }>();
  for (const step of steps) {
    const entry = byCategory.get(step.category) ?? { category: step.category, ms: 0, pages: new Set<string>() };
    entry.ms += step.ms ?? 0; entry.pages.add(step.path);
    byCategory.set(step.category, entry);
  }
  const closedUntimed = times.some(t => index.facts.get(t.view)?.partial || (!t.time?.open && !(t.time?.beacon)));
  const firstView = times[0].view;
  return {
    sessionId, start, end, stayMs, readingMs, awayMs: Math.max(0, stayMs - readingMs), open,
    views: times.length, pages: new Set(steps.map(step => step.path)).size, steps, clicks: clicks.length,
    categories: [...byCategory.values()].map(c => ({ category: c.category, ms: c.ms, pages: c.pages.size })).sort((a, b) => b.ms - a.ms || b.pages - a.pages),
    entry: firstView.path, exit: open ? null : times.at(-1)!.view.path,
    source: firstView.utm_source || firstView.referrer_host || null,
    campaign: firstView.utm_medium || firstView.utm_campaign ? [firstView.utm_medium, firstView.utm_campaign].filter(Boolean).join(" · ") : null,
    timing: open ? "live" : closedUntimed ? "partial" : "recorded",
  };
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** How far along the site a person got, from the pages they opened: each signal is something they actually did. */
function journeyStage(views: StreamVisit[], visits: VisitSummary[], signedIn: boolean): { stage: JourneyStage; signals: string[] } {
  const paths = views.map(view => view.path.toLowerCase());
  const distinct = (test: (p: string) => boolean) => new Set(paths.filter(test)).size;
  const articles = distinct(p => /^\/tech-buzz\/.+/.test(p));
  const references = [...new Set(paths.filter(p => p.startsWith("/api-reference/")).map(p => p.split("/")[2]).filter(Boolean))];
  const lessons = distinct(p => /^\/learning\/.+/.test(p));
  const plans = paths.some(p => p.startsWith("/subscribe") || p.startsWith("/pricing") || p.startsWith("/checkout"));
  const signUp = paths.some(p => p.startsWith("/sign-up")), dashboard = paths.some(p => p === "/learning" || p.startsWith("/learning/"));
  const signals: string[] = [];
  if (signedIn) signals.push(dashboard ? "Signed in and used the Learning Dashboard" : "Signed in");
  else if (signUp) signals.push("Opened the sign-up page without finishing");
  if (plans) signals.push("Looked at plans & pricing");
  if (lessons) signals.push(`Opened ${count(lessons, "dashboard page")}`);
  if (references.length) signals.push(`Studied API references: ${references.slice(0, 4).join(", ")}${references.length > 4 ? ` +${references.length - 4}` : ""}`);
  if (articles) signals.push(`Read ${count(articles, "Tech Buzz article")}`);
  if (paths.some(p => p.startsWith("/compare"))) signals.push("Compared tools");
  if (paths.some(p => p.startsWith("/courses"))) signals.push("Browsed the course catalogue");
  if (paths.some(p => p.startsWith("/contact"))) signals.push("Opened the contact page");
  if (visits.length > 1) signals.push(`Came back: ${count(visits.length, "visit")} in the window`);
  const clicks = visits.reduce((sum, v) => sum + v.clicks, 0);
  if (clicks) signals.push(`${count(clicks, "tracked click")}`);
  const stage: JourneyStage = signedIn && dashboard ? "Learner" : plans ? "Evaluating plans" : signedIn ? "Account holder" : signUp ? "Signing up" : articles || references.length || lessons ? "Studying content" : "Browsing";
  return { stage, signals };
}
