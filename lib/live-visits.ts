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
  /** Keyed hash of the network and the reported screen: together with browser and OS, a device fingerprint. */
  ip_hash?: string | null; screen?: string | null;
  /** Reported by the browser with each page view; ip_masked is the network address with its last part hidden. */
  language?: string | null; timezone?: string | null; ip_masked?: string | null;
};
export type Presence = { session_id: string; path: string; started_at: string; seen_at: string };

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

export type StreamVisitor = {
  key: string; email: string | null; first: StreamVisit; last: StreamVisit; current: StreamVisit; page: PageTime | null;
  views: number; pages: number; sessions: number; engagedMs: number; trail: string[]; source: string | null;
  arrived: string; lastAt: number; left: number | null; beacon: boolean; live: boolean; signedIn: boolean;
  stayDurationMs: number;
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
};

const at = (iso: string) => Date.parse(iso);

/** What one page view is known to have: its closed stretches, and the stretch still running when there is one. */
type ViewFacts = { from: number; beaconMs: number; lastLeave: number | null; beacons: number; running: { since: number; seen: number; heartbeat: boolean } | null; legacyOpen: boolean };
type Person = { key: string; user: string | null; email: string | null; views: StreamVisit[]; lastEvent: number };
export type VisitIndex = { facts: Map<StreamVisit, ViewFacts>; people: Person[] };

/** The part that depends only on the rows: run when the data changes, not on every tick of the clock. */
export function indexVisits(rows: StreamVisit[], presence: Presence[] | null): VisitIndex {
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
        if (beat && seen > (entry.lastLeave ?? entry.from)) entry.running = { since: Math.max(at(beat.started_at), entry.lastLeave ?? entry.from), seen, heartbeat: true };
        else if (presence && entry.lastLeave == null) entry.running = { since: entry.from, seen: entry.from, heartbeat: false };
        entry.legacyOpen = !presence && entry.lastLeave == null && latestView.get(view.session_id) === entry.from;
      }
      facts.set(view, entry);
    };
    for (const row of list) {
      if (row.event === "page_view") { close(false); view = row; entry = { from: at(row.created_at), beaconMs: 0, lastLeave: null, beacons: 0, running: null, legacyOpen: false }; }
      else if (entry) { entry.beaconMs += Math.max(0, Number(row.duration_ms) || 0); entry.lastLeave = at(row.created_at); entry.beacons++; }
    }
    close(true);
  }

  const people = [...byPerson].flatMap(([key, list]) => {
    const views = list.filter(row => row.event === "page_view").sort((a, b) => at(a.created_at) - at(b.created_at));
    if (!views.length) return [];
    const user = list.map(row => row.user_id || linked.get(row.visitor_id)).find(Boolean) ?? null;
    return [{ key, user, email: list.find(row => row.email)?.email ?? null, views, lastEvent: Math.max(...list.map(row => at(row.created_at))) }];
  });
  return { facts, people };
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
  const p = path.toLowerCase();
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

/** Determines if a visitor had active visible engagement, live presence, or recorded page views. */
export function isEngagedVisitor(v: { engagedMs: number; live?: boolean; page?: { ms: number } | null; views?: number }): boolean {
  return Boolean(v.live) || Math.round(v.engagedMs / 1000) > 0 || (v.page?.ms ?? 0) > 0 || (v.views ?? 0) > 0;
}

/**
 * One row per visitor (the signed-in person, or the anonymous browser): visitors on the site now first, then the most
 * recently active. `emails` maps account ids to emails for visitors whose rows did not carry one.
 * When `filterZeroSeconds` is true, visitors with 0 seconds of active engagement are excluded.
 */
export function streamVisitors(index: VisitIndex, now: number, emails: Record<string, string> = {}, filterZeroSeconds = false): StreamVisitor[] {
  const list = index.people.map(person => {
    const { views } = person, first = views[0], last = views.at(-1)!;
    const times = views.map(view => ({ view, time: pageTime(index.facts.get(view), now) }));
    const openNow = times.filter(t => t.time?.open).at(-1);
    const current = openNow?.view ?? last, currentTime = times.find(t => t.view === current)?.time;
    const lastAt = Math.max(person.lastEvent, ...times.map(t => t.time?.lastSignal ?? 0));
    const latest = times.reduce<typeof times[number] | null>((best, t) => !best || (t.time?.lastSignal ?? 0) >= (best.time?.lastSignal ?? 0) ? t : best, null);
    // The latest session's path through the site, without repeats in a row, and where that session came from.
    const session = views.filter(view => view.session_id === last.session_id);
    const sessionFirst = session[0] || first;
    const sessionArrived = sessionFirst.created_at;
    const sessionArrivedEpoch = at(sessionArrived);
    const arrivedEpoch = at(first.created_at);
    const trail = session.map(view => view.path).filter((path, i, all) => path !== all[i - 1]).slice(-4);
    
    // Multiple algorithm stay duration calculation:
    const sessionStayMs = Math.max(0, (openNow ? now : lastAt) - sessionArrivedEpoch);
    const totalStayMs = Math.max(0, (openNow ? now : lastAt) - arrivedEpoch);
    const stayDurationMs = Math.max(sessionStayMs, openNow ? (currentTime?.ms ?? 0) : 0);
    const totalStayDurationMs = Math.max(totalStayMs, stayDurationMs);
    const postalCode = views.map(v => v.postal_code).find(Boolean) ?? null;

    const contentMap = new Map<string, EngagedContent>();
    for (const { view, time } of times) {
      const p = view.path || "/";
      const duration = Math.max(0, time?.ms ?? (view.duration_ms || 0));
      const category = getLearningCategory(p);
      const title = getCleanTitle(view.title, p);
      const existing = contentMap.get(p) ?? { path: p, title, category, durationMs: 0, views: 0 };
      existing.durationMs += duration;
      existing.views += 1;
      contentMap.set(p, existing);
    }
    const engagedContents = [...contentMap.values()].sort((a, b) => b.durationMs - a.durationMs || b.views - a.views);

    const engagedMs = times.reduce((sum, t) => sum + (t.time?.ms ?? 0), 0);
    const focusRatio = Math.min(100, Math.max(1, Math.round((engagedMs / Math.max(stayDurationMs, engagedMs, 1000)) * 100)));
    let intensityTier: "Deep Focus" | "Active Study" | "Exploring" = "Exploring";
    if (focusRatio >= 70 && engagedMs >= 120_000) {
      intensityTier = "Deep Focus";
    } else if (engagedMs >= 45_000 || focusRatio >= 40) {
      intensityTier = "Active Study";
    }
    const readingVelocity = views.length > 0 ? `${Math.max(1, Math.round(engagedMs / 1000 / views.length))}s / page` : "—";

    const currentStepIndex = session.findIndex(v => v === current);
    const currentStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : session.length;
    const currentStep = {
      step: currentStepNumber,
      total: session.length,
      title: getCleanTitle(current.title, current.path),
      category: getLearningCategory(current.path),
    };

    let leftAlgorithm: "beacon" | "heartbeat" | "legacy" | "live" = "live";
    if (openNow) {
      leftAlgorithm = "live";
    } else if (latest?.time?.beacon) {
      leftAlgorithm = "beacon";
    } else if (latest?.time?.lastSignal && !(latest.time as { beacon?: boolean }).beacon) {
      leftAlgorithm = "heartbeat";
    } else {
      leftAlgorithm = "legacy";
    }

    let timeSpentAlgorithm: "beacon" | "heartbeat_live" | "hybrid" | "legacy" = "beacon";
    const hasHeartbeat = times.some(t => Boolean(t.time?.open || (t.view && index.facts.get(t.view)?.running?.heartbeat)));
    const hasBeacon = times.some(t => (index.facts.get(t.view)?.beaconMs ?? 0) > 0);
    if (openNow && hasBeacon) {
      timeSpentAlgorithm = "hybrid";
    } else if (openNow) {
      timeSpentAlgorithm = "heartbeat_live";
    } else if (hasBeacon) {
      timeSpentAlgorithm = "beacon";
    } else {
      timeSpentAlgorithm = "legacy";
    }

    return {
      key: person.key, email: (person.user && emails[person.user]) || person.email, first, last, current,
      page: currentTime ? { ms: currentTime.ms, open: currentTime.open } : null, views: views.length, pages: new Set(views.map(view => view.path)).size,
      sessions: new Set(views.map(view => view.session_id)).size, engagedMs,
      trail, source: session[0].utm_source || session[0].referrer_host || null,
      arrived: first.created_at, lastAt, left: openNow ? null : lastAt, beacon: !openNow && Boolean(latest?.time?.beacon),
      live: Boolean(openNow), signedIn: Boolean(person.user),
      stayDurationMs,
      postalCode,
      engagedContents,
      sessionArrived,
      firstArrived: first.created_at,
      totalStayDurationMs,
      focusRatio,
      intensityTier,
      readingVelocity,
      currentStep,
      leftAlgorithm,
      timeSpentAlgorithm,
    };
  }).sort((a, b) => Number(b.live) - Number(a.live) || b.lastAt - a.lastAt);

  return filterZeroSeconds ? list.filter(isEngagedVisitor) : list;
}
