"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Briefcase, Camera, Globe2, Link2, Mail, MessageCircle, Monitor, Pin, Radio, Search, Sparkles, ThumbsUp, TrendingUp, AtSign, PlayCircle } from "lucide-react";
import { SOURCE_LABEL, type SourceId } from "@/lib/traffic-sources";
import type { TrafficSourcesReport } from "@/lib/server/traffic-sources";
import styles from "./super-admin-traffic-sources.module.css";

/*
 * Super Admin → Traffic sources: who is on the site right now and which platform brought them (Instagram, Facebook,
 * LinkedIn, X, Pinterest, TrustMRR, Google, Direct and the rest), then the window's sessions per platform, campaigns
 * and the latest arrivals as a trace. Reads /api/super-admin/sources every 15 seconds while the tab is visible.
 */
const PINNED: SourceId[] = ["instagram", "facebook", "linkedin", "x", "pinterest", "trustmrr", "google", "direct"];
const ICON: Partial<Record<SourceId, typeof Globe2>> = {
  instagram: Camera, facebook: ThumbsUp, linkedin: Briefcase, x: AtSign, pinterest: Pin, trustmrr: TrendingUp, google: Search, bing: Search, search: Search,
  direct: Monitor, youtube: PlayCircle, whatsapp: MessageCircle, telegram: MessageCircle, reddit: MessageCircle, threads: MessageCircle, quora: MessageCircle,
  ai: Sparkles, email: Mail, referral: Link2,
};
const n = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const time = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));
const place = (city: string | null, country: string | null) => [city, country].filter(Boolean).join(", ") || "Location not reported";

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

  return <section className={styles.wrap} aria-labelledby="traffic-sources-h">
    <header className={styles.head}>
      <h2 id="traffic-sources-h"><Radio size={16} aria-hidden="true" />Traffic sources · live</h2>
      <p>Updated {time(data.generatedAt)} IST · refreshes every 15 s · live means the page was open and visible in the last {data.liveSeconds} s · window: last {data.days} {data.days === 1 ? "day" : "days"}</p>
    </header>

    <dl className={styles.totals}>
      <div data-tone="live"><dt>Live now</dt><dd>{n(data.live.total)}</dd><small>{n(data.live.signedIn)} signed in</small></div>
      <div><dt>Sessions</dt><dd>{n(data.totals.sessions)}</dd><small>{n(data.totals.visitors)} visitors · {n(data.totals.views)} views</small></div>
      <div><dt>Social</dt><dd>{n(data.totals.social)}</dd><small>sessions from social platforms</small></div>
      <div><dt>Search</dt><dd>{n(data.totals.search)}</dd><small>Google, Bing and others</small></div>
      <div><dt>Direct</dt><dd>{n(data.totals.direct)}</dd><small>typed, bookmarked or untagged apps</small></div>
    </dl>

    <ul className={styles.platforms} aria-label="Platforms">
      {[...PINNED.map(id => row(id) ?? { id, label: SOURCE_LABEL[id], sessions: 0, visitors: 0, views: 0, signedIn: 0, live: 0 }), ...others].map(source => { const Icon = ICON[source.id] ?? Globe2; return <li key={source.id} data-source={source.id} data-live={source.live > 0 || undefined}>
        <span className={styles.platformName}><Icon size={15} aria-hidden="true" />{source.label}</span>
        <b>{n(source.live)}<small> live</small></b>
        <span className={styles.bar} aria-hidden="true"><i style={{ width: `${source.sessions ? Math.max(4, source.sessions / max * 100) : 0}%` }} /></span>
        <span className={styles.meta}>{n(source.sessions)} sessions · {n(source.visitors)} visitors · {n(source.views)} views{source.signedIn ? ` · ${n(source.signedIn)} signed in` : ""}</span>
      </li>; })}
    </ul>

    <div className={styles.columns}>
      <section className={styles.card} aria-labelledby="live-sessions-h">
        <h3 id="live-sessions-h">On the site now ({n(data.live.total)})</h3>
        {data.live.sessions.length === 0 ? <p className={styles.empty}>Nobody has the site open right now.</p>
          : <ol className={styles.trace}>{data.live.sessions.map(session => <li key={`${session.startedAt}-${session.path}`}>
            <span className={styles.chip} data-source={session.source}>{session.label}</span>
            <div><b>{session.path}</b><small>{place(session.city, session.country)} · {session.device ?? "device not reported"} · {session.views} {session.views === 1 ? "page" : "pages"} · landed on {session.landing}{session.campaign ? ` · campaign ${session.campaign}` : ""}{session.signedIn ? " · signed in" : ""}</small></div>
            <time dateTime={session.seenAt}>{time(session.seenAt)}</time>
          </li>)}</ol>}
      </section>
      <section className={styles.card} aria-labelledby="arrivals-h">
        <h3 id="arrivals-h">Latest arrivals</h3>
        {data.arrivals.length === 0 ? <p className={styles.empty}>No sessions in this window.</p>
          : <ol className={styles.trace}>{data.arrivals.map(session => <li key={`${session.startedAt}-${session.landing}`}>
            <span className={styles.chip} data-source={session.source}>{session.label}</span>
            <div><b>{session.landing}</b><small>{session.referrer ? `from ${session.referrer}` : "no referrer"}{session.campaign ? ` · campaign ${session.campaign}` : ""} · {place(session.city, session.country)} · {session.views} {session.views === 1 ? "page" : "pages"}{session.signedIn ? " · signed in" : ""}</small></div>
            <time dateTime={session.startedAt}>{time(session.startedAt)}</time>
          </li>)}</ol>}
      </section>
    </div>

    {data.campaigns.length > 0 && <section className={styles.card} aria-labelledby="campaigns-h">
      <h3 id="campaigns-h">Tagged campaigns</h3>
      <ul className={styles.campaigns}>{data.campaigns.map(item => <li key={`${item.source}-${item.campaign}`}><span className={styles.chip} data-source={item.source}>{item.label}</span><b>{item.campaign}</b><span>{n(item.sessions)} sessions</span></li>)}</ul>
    </section>}
    <p className={styles.note}>Instagram, Facebook and other in-app browsers often send no referrer, so their visits count as Direct unless the shared link is tagged, e.g. <code>?utm_source=instagram&amp;utm_campaign=launch</code>. Tag every link you post for exact platform numbers.{data.capped ? " This window holds more than 40,000 page views; only the first 40,000 are counted." : ""}</p>
  </section>;
}
