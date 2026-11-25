"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { indexVisits, streamVisitors, type Presence, type StreamClick, type StreamVisit } from "@/lib/live-visits";

type Feed = { visits: StreamVisit[]; presence: Presence[] | null; clicks: StreamClick[]; emails: Record<string, string>; capped: boolean; days: number; generatedAt: string };

/**
 * The Live visitor stream's visitors (lib/live-visits.ts) for pages other than the Overview, read in full from
 * /api/super-admin/activity/stream every `refreshMs` while the tab is visible. Counting from these, instead of the SQL
 * report's distinct browser ids, keeps every super admin page on one definition of a visitor.
 * `everyone` is null until the first read succeeds; callers fall back to the SQL report until then.
 */
export function useStreamVisitors(refreshMs = 30_000, enabled = true) {
  const [feed, setFeed] = useState<Feed | null>(null);
  // The newest read failed (the last good feed stays on screen); `tick` forces a read now (the Refresh button).
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/super-admin/activity/stream", { cache: "no-store", signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.visits)) { setFailed(true); return; }
        setFailed(false);
        setFeed({ visits: body.visits, presence: Array.isArray(body.presence) ? body.presence : null, clicks: Array.isArray(body.clicks) ? body.clicks : [],
          emails: body.emails ?? {}, capped: Boolean(body.capped), days: Number(body.days) || 5, generatedAt: String(body.generatedAt ?? new Date().toISOString()) });
      } catch { if (!controller.signal.aborted) setFailed(true); /* keep the last good read */ }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, refreshMs);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refreshMs, tick, enabled]);
  return useMemo(() => {
    if (!feed) return { everyone: null, rows: [] as StreamVisit[], now: 0, capped: false, days: 5, failed, reload };
    // Timed on the server's clock, so "on the site now" agrees with the rows' stamps.
    const now = Date.parse(feed.generatedAt);
    return { everyone: streamVisitors(indexVisits(feed.visits, feed.presence, feed.clicks), now, feed.emails), rows: feed.visits, now, capped: feed.capped, days: feed.days, failed, reload };
  }, [feed, failed, reload]);
}
