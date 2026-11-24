"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Briefcase, Camera, Globe2, Link2, Mail, MessageCircle, Monitor, Pin, Radio, Search, Sparkles, ThumbsUp, TrendingUp, AtSign, PlayCircle } from "lucide-react";
import { SOURCE_LABEL, type SourceId } from "@/lib/traffic-sources";
import type { TrafficSourcesReport } from "@/lib/server/traffic-sources";
import styles from "./super-admin-traffic-sources.module.css";

/*
 * Super Admin → User activities → Traffic sources: the reporting window's sessions per platform (Instagram, Facebook,
 * LinkedIn, X, Pinterest, TrustMRR, Google, Direct and the rest). Reads /api/super-admin/sources every 15 seconds while
 * the tab is visible. LiveVisitorsBadge (every page's header) reads the same endpoint for the live count.
 */
const PINNED: SourceId[] = ["instagram", "facebook", "linkedin", "x", "pinterest", "trustmrr", "google", "direct"];
const ICON: Partial<Record<SourceId, typeof Globe2>> = {
  instagram: Camera, facebook: ThumbsUp, linkedin: Briefcase, x: AtSign, pinterest: Pin, trustmrr: TrendingUp, google: Search, bing: Search, search: Search,
  direct: Monitor, youtube: PlayCircle, whatsapp: MessageCircle, telegram: MessageCircle, reddit: MessageCircle, threads: MessageCircle, quora: MessageCircle,
  ai: Sparkles, email: Mail, referral: Link2,
};
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** The live visitor count with its pulse, for the header of every Super Admin page. */
export function LiveVisitorsBadge() {
  const [live, setLive] = useState<{ total: number; signedIn: number } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetch("/api/super-admin/sources?days=1", { cache: "no-store", signal: controller.signal })
      .then(response => response.ok ? response.json() as Promise<TrafficSourcesReport> : null).then(data => { if (data) setLive(data.live); }).catch(() => {});
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  return <span className={styles.badge} role="status" title="Visitors with this site open and visible in the last 100 seconds">
    <i aria-hidden="true" />{live ? `${n(live.total)} live now` : "Live…"}{live && live.signedIn > 0 ? ` · ${n(live.signedIn)} signed in` : ""}
  </span>;
}

export function SuperAdminTrafficSources({ days }: { days: number }) {
  const [data, setData] = useState<TrafficSourcesReport | null>(null); const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/super-admin/sources?days=${days}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("failed");
        setData(await response.json() as TrafficSourcesReport); setFailed(false);
      } catch { if (!controller.signal.aborted) setFailed(true); }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [days]);

  if (failed && !data) return <p className={styles.error} role="status"><AlertTriangle size={14} aria-hidden="true" /> Traffic sources are unavailable right now; retrying every 15 seconds.</p>;
  if (!data) return <div className={styles.loading} aria-busy="true">Loading traffic sources…</div>;
  const row = (id: SourceId) => data.sources.find(source => source.id === id);
  const others = data.sources.filter(source => !PINNED.includes(source.id));
  const max = Math.max(1, ...data.sources.map(source => source.sessions));

  // User activities only (2026-11-24): where the reporting window's visits came from. Who is on the site now and the
  // latest arrivals live in the Overview's visitor stream, and tagged campaigns in the Campaigns (UTM) panel, so they are
  // not repeated here.
  return <section className={styles.wrap} aria-labelledby="traffic-sources-h">
    <header className={styles.head}>
      <h2 id="traffic-sources-h"><Radio size={16} aria-hidden="true" />Traffic sources</h2>
      <p>Last {data.days} {data.days === 1 ? "day" : "days"} · updated {time(data.generatedAt)} IST · refreshes every 15 s</p>
    </header>

    <dl className={styles.totals}>
      <div><dt>Sessions</dt><dd>{n(data.totals.sessions)}</dd><small>{n(data.totals.visitors)} visitors · {n(data.totals.views)} views</small></div>
      <div><dt>Search</dt><dd>{n(data.totals.search)}</dd><small>Google, Bing and others</small></div>
      <div><dt>Social</dt><dd>{n(data.totals.social)}</dd><small>sessions from social platforms</small></div>
      <div><dt>Direct</dt><dd>{n(data.totals.direct)}</dd><small>typed, bookmarked or untagged apps</small></div>
    </dl>

    <ul className={styles.platforms} aria-label="Platforms">
      {[...PINNED.map(id => row(id) ?? { id, label: SOURCE_LABEL[id], sessions: 0, visitors: 0, views: 0, signedIn: 0, live: 0 }), ...others].map(source => { const Icon = ICON[source.id] ?? Globe2; return <li key={source.id} data-source={source.id}>
        <span className={styles.platformName}><Icon size={15} aria-hidden="true" />{source.label}</span>
        <b>{n(source.sessions)}<small> sessions</small></b>
        <span className={styles.bar} aria-hidden="true"><i style={{ width: `${source.sessions ? Math.max(4, source.sessions / max * 100) : 0}%` }} /></span>
        <span className={styles.meta}>{n(source.visitors)} visitors · {n(source.views)} views{source.signedIn ? ` · ${n(source.signedIn)} signed in` : ""}</span>
      </li>; })}
    </ul>

    <p className={styles.note}>Instagram, Facebook and other in-app browsers often send no referrer, so their visits count as Direct unless the shared link is tagged, e.g. <code>?utm_source=instagram&amp;utm_campaign=launch</code>. Tag every link you post for exact platform numbers.{data.capped ? " This window holds more than 40,000 page views; only the first 40,000 are counted." : ""}</p>
  </section>;
}
