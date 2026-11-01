"use client";
import { useEffect, useMemo, useState } from "react";
import { indexVisits, streamVisitors, type Presence, type StreamClick, type StreamVisit } from "@/lib/live-visits";

type Feed = { visits: StreamVisit[]; presence: Presence[] | null; clicks: StreamClick[]; emails: Record<string, string>; capped: boolean; days: number; generatedAt: string };

/**
 * The Live visitor stream's visitors (lib/live-visits.ts) for pages other than the Overview, read in full from
 * /api/super-admin/activity/stream every `refreshMs` while the tab is visible. Counting from these, instead of the SQL
 * report's distinct browser ids, keeps every super admin page on one definition of a visitor.
 * `everyone` is null until the first read succeeds; callers fall back to the SQL report until then.
 */
export function useStreamVisitors(refreshMs = 30_000) {
  const [feed, setFeed] = useState<Feed | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/super-admin/activity/stream", { cache: "no-store", signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.visits)) return;
        setFeed({ visits: body.visits, presence: Array.isArray(body.presence) ? body.presence : null, clicks: Array.isArray(body.clicks) ? body.clicks : [],
          emails: body.emails ?? {}, capped: Boolean(body.capped), days: Number(body.days) || 5, generatedAt: String(body.generatedAt ?? new Date().toISOString()) });
      } catch { /* keep the last good read; the page shows the SQL report meanwhile */ }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, refreshMs);
    return () => { controller.abort(); clearInterval(timer); };
  }, [refreshMs]);
  return useMemo(() => {
    if (!feed) return { everyone: null, now: 0, capped: false, days: 5 };
    // Timed on the server's clock, so "on the site now" agrees with the rows' stamps.
    const now = Date.parse(feed.generatedAt);
    return { everyone: streamVisitors(indexVisits(feed.visits, feed.presence, feed.clicks), now, feed.emails), now, capped: feed.capped, days: feed.days };
  }, [feed]);
}
