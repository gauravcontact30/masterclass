"use client";
import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Clock, DoorOpen, Gauge, Globe2, Hourglass, Megaphone, MonitorSmartphone, Radio, ShieldCheck, Sigma, Timer, Trophy, UserCheck } from "lucide-react";
import type { StreamVisitor } from "@/lib/live-visits";
import { DEEP_MS, ENGAGED_MS, stayClock, stayText, timeOnSite, type Engagement } from "@/lib/time-on-site";
import { GROUP_LABEL } from "@/lib/visitor-report";
import { LIVE_MS } from "@/lib/live-visits";
import { countryName } from "./super-admin-audience";
import { CountryFlag } from "./country-flag";
import styles from "./super-admin-time-on-site.module.css";

const n = (value: number) => value.toLocaleString("en-IN");
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";
const clockIST = (ms: number) => new Date(ms + 19_800_000).toISOString().slice(11, 19);
const placeOf = (city: string | null, country: string | null) => [city, country ? countryName(country) || country : null].filter(Boolean).join(", ") || "Not reported";

/**
 * How long visitors stay, for the Overview (today) and User activities (the reporting window). `everyone` is that page's
 * own visitor list and `now` the clock of its latest read, so the figures match every panel beside it. Visitors on the
 * site right now get running clocks: between reads they advance with the wall clock (only while their page is being
 * read, and for at most the heartbeat window), and every read resets them to the recorded figures.
 */
export function SuperAdminTimeOnSite({ everyone, from, now, ownHosts, windowLabel, exact }: Readonly<{ everyone: StreamVisitor[]; from: number; now: number; ownHosts: readonly string[]; windowLabel: string; exact: boolean }>) {
  const data = useMemo(() => exact ? timeOnSite(everyone, from, Infinity, ownHosts) : null, [exact, everyone, from, ownHosts]);
  // Time since this read landed, ticking each second while anyone is on the site; a new read starts it again at zero.
  const [elapsed, setElapsed] = useState({ now, ms: 0 });
  const anyoneLive = Boolean(data?.live.length);
  useEffect(() => {
    if (!anyoneLive) return;
    const landed = Date.now();
    const timer = setInterval(() => setElapsed({ now, ms: Date.now() - landed }), 1000);
    return () => clearInterval(timer);
  }, [now, anyoneLive]);

  if (!data) return <section className={styles.panel} aria-busy="true"><p className={styles.wait}>Timing visitors once the visitor stream has loaded…</p></section>;
  // Never run past the heartbeat window: if reads stop, the clocks stop instead of inventing time.
  const extra = elapsed.now === now ? Math.min(LIVE_MS, Math.max(0, elapsed.ms)) : 0;
  const maxBucket = Math.max(1, ...data.buckets.map(b => b.people));
  const timed = data.timing.recorded + data.timing.live + data.timing.partial;

  return <section className={styles.panel}>
    <article className={styles.card} data-tone="live">
      <h3><Radio size={16} aria-hidden="true" />On the site right now<span>{data.live.length ? `${n(data.live.length)} ${data.live.length === 1 ? "visitor" : "visitors"} · clocks run live, IST ${clockIST(now + extra)}` : "nobody at the moment"}</span></h3>
      {data.live.length ? <div className={styles.tableWrap}><table>
        <thead><tr><th scope="col">Visitor</th><th scope="col">On site for</th><th scope="col">On screen</th><th scope="col">Reading now</th><th scope="col">Pages</th><th scope="col">Came from</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
        <tbody>{data.live.map(v => <tr key={v.key}>
          <th scope="row"><span className={styles.pulse} aria-hidden="true" />{v.who}<small>{v.signedIn ? "Signed in" : GROUP_LABEL[v.group]}{v.visitsBefore ? ` · ${v.visitsBefore} earlier ${v.visitsBefore === 1 ? "visit" : "visits"}` : ""} · since {clockIST(v.arrivedAt)}</small></th>
          <td className={styles.clock}>{stayClock(v.stayMs + extra)}</td>
          <td className={styles.clock}>{stayClock(v.onScreenMs + (v.reading ? extra : 0))}</td>
          <td className={styles.page}><code title={v.pageTitle}>{v.page}</code><small>{v.reading ? `${stayText((v.pageMs ?? 0) + extra)} on this page` : "tab in background"}</small></td>
          <td>{n(v.pagesThisVisit)}</td><td>{v.source}</td>
          <td><span className={styles.place}><CountryFlag code={v.country} size={16} />{placeOf(v.city, v.country)}</span></td>
          <td>{[v.device, v.browser].filter(Boolean).join(" · ")}</td>
        </tr>)}</tbody>
      </table></div> : <p className={styles.empty}>No page has sent a heartbeat in the last {Math.round(LIVE_MS / 1000)} seconds. Visitors appear here the moment they open a page.</p>}
    </article>

    <dl className={styles.kpis}>
      <Kpi icon={Timer} tone="sky" label="Avg. time on screen" value={stayText(data.avgOnScreenMs)} note={`per visitor · median ${stayText(data.medianOnScreenMs)}`} />
      <Kpi icon={Hourglass} tone="lavender" label="Avg. visit length" value={stayText(data.avgVisitMs)} note={`arrival to last activity · median ${stayText(data.medianVisitMs)}`} />
      <Kpi icon={Sigma} tone="mint" label="Total time on screen" value={stayText(data.totalOnScreenMs)} note={`${n(data.people)} visitors · ${n(data.visits)} visits`} />
      <Kpi icon={UserCheck} tone="peach" label="Engaged visitors" value={pct(data.engaged, data.people)} note={`${n(data.engaged)} stayed ${ENGAGED_MS / 1000} s or more on screen`} />
      <Kpi icon={BookOpenText} tone="butter" label="Deep readers" value={n(data.deep)} note={`${pct(data.deep, data.people)} read ${DEEP_MS / 60_000} min or more`} />
      <Kpi icon={Trophy} tone="rose" label="Longest visit" value={stayText(data.longestVisitMs)} note={`${pct(data.bounced, data.visits)} of visits opened one page`} />
    </dl>

    <div className={styles.grid}>
      <article className={styles.card}>
        <h3><Gauge size={16} aria-hidden="true" />How long visitors stay<span>time on screen per visitor, {windowLabel}</span></h3>
        <ol className={styles.buckets}>{data.buckets.map(b => <li key={b.label}>
          <span>{b.label}</span><i><b style={{ width: `${(b.people / maxBucket) * 100}%` }} /></i><strong>{n(b.people)}</strong><small>{pct(b.people, data.people)}</small>
        </li>)}</ol>
      </article>
      <Ranked title="Pages that hold attention" icon={Clock} empty="No timed page views yet." heads={["Page", "Time on screen", "Avg / view"]}
        rows={data.pages.map(p => ({ key: p.path, label: <code title={p.title}>{p.path}</code>, sub: `${n(p.people)} visitors · ${n(p.views)} views`, a: stayText(p.totalMs), b: stayText(p.avgMs) }))} />
      <EngagementCard title="Sources that bring engaged visitors" icon={Megaphone} rows={data.sources} />
      <EngagementCard title="Engagement by country" icon={Globe2} rows={data.countries} render={key => <span className={styles.place}><CountryFlag code={key === "Unknown" ? null : key} size={16} />{key === "Unknown" ? "Not resolved" : countryName(key) || key}</span>} />
      <EngagementCard title="Engagement by device" icon={MonitorSmartphone} rows={data.devices} />
      <Ranked title="Where visitors leave" icon={DoorOpen} empty="No finished visits yet." heads={["Exit page", "Exits", "Exit rate"]}
        rows={data.exits.map(e => ({ key: e.path, label: <code>{e.path}</code>, sub: `${n(e.views)} views`, a: n(e.exits), b: `${e.exitRate}%` }))} />
    </div>

    <article className={styles.card}>
      <h3><Trophy size={16} aria-hidden="true" />Longest visits<span>{windowLabel}, most time on screen first</span></h3>
      {data.longest.length ? <div className={styles.tableWrap}><table>
        <thead><tr><th scope="col">Visitor</th><th scope="col">Started (IST)</th><th scope="col">On screen</th><th scope="col">Visit length</th><th scope="col">Pages</th><th scope="col">Entry → exit</th><th scope="col">Came from</th><th scope="col">Location</th></tr></thead>
        <tbody>{data.longest.map(v => <tr key={v.key}>
          <th scope="row">{v.who}{v.open && <em className={styles.liveTag}>on site</em>}</th>
          <td>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(v.start))} {clockIST(v.start)}</td>
          <td className={styles.clock}>{stayClock(v.onScreenMs)}</td><td className={styles.clock}>{stayClock(v.stayMs)}</td><td>{n(v.views)}</td>
          <td className={styles.page}><code>{v.entry}</code><small>{v.open ? "still on the site" : `left from ${v.exit ?? "—"}`}</small></td>
          <td>{v.source}</td><td><span className={styles.place}><CountryFlag code={v.country} size={16} />{placeOf(v.city, v.country)}</span></td>
        </tr>)}</tbody>
      </table></div> : <p className={styles.empty}>No visits in this window yet.</p>}
    </article>

    <p className={styles.note}><ShieldCheck size={14} aria-hidden="true" /><span><b>How the time is measured.</b> Time on screen is the time a page was visible (a hidden tab or a second window is not counted twice), from each page&apos;s leave beacon and the heartbeat of pages still open. Visit length runs from arrival to the last activity. Of {n(timed)} visits, <b>{n(data.timing.recorded)}</b> are fully recorded, <b>{n(data.timing.live)}</b> are still running and <b>{n(data.timing.partial)}</b> lost a beacon (only the recorded time is counted, nothing is guessed). Crawlers, automated browsers and visits under a second are left out.</span></p>
  </section>;
}

function Kpi({ icon: Icon, tone, label, value, note }: Readonly<{ icon: typeof Timer; tone: string; label: string; value: string; note: string }>) {
  return <div className={styles.kpi} data-tone={tone}><dt><Icon size={13} aria-hidden="true" />{label}</dt><dd>{value}</dd><small>{note}</small></div>;
}

function Ranked({ title, icon: Icon, heads, rows, empty }: Readonly<{ title: string; icon: typeof Timer; heads: [string, string, string]; rows: { key: string; label: React.ReactNode; sub: string; a: string; b: string }[]; empty: string }>) {
  return <article className={styles.card}>
    <h3><Icon size={16} aria-hidden="true" />{title}</h3>
    {rows.length ? <div className={styles.ranked}>
      <div className={styles.rankedHead} aria-hidden="true"><span>{heads[0]}</span><span>{heads[1]}</span><span>{heads[2]}</span></div>
      <ol>{rows.map(r => <li key={r.key}><span className={styles.rankedLabel}>{r.label}<small>{r.sub}</small></span><strong>{r.a}</strong><span>{r.b}</span></li>)}</ol>
    </div> : <p className={styles.empty}>{empty}</p>}
  </article>;
}

function EngagementCard({ title, icon, rows, render }: Readonly<{ title: string; icon: typeof Timer; rows: Engagement[]; render?: (key: string) => React.ReactNode }>) {
  return <Ranked title={title} icon={icon} empty="No visitors in this window yet." heads={["", "Avg. on screen", "Bounce"]}
    rows={rows.map(r => ({ key: r.key, label: render ? render(r.key) : r.label, sub: `${n(r.people)} ${r.people === 1 ? "visitor" : "visitors"} · ${n(r.visits)} visits`, a: stayText(r.avgOnScreenMs), b: `${r.bounceRate}%` }))} />;
}
