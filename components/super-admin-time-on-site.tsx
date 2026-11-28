"use client";
import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Clock, DoorOpen, Gauge, Globe2, Hourglass, Megaphone, MonitorSmartphone, Radio, ShieldCheck, Sigma, Timer, Trophy, UserCheck } from "lucide-react";
import type { StreamVisitor } from "@/lib/live-visits";
import { DEEP_MS, ENGAGED_MS, stayClock, stayText, timeLeaders, timeOnSite, type Engagement } from "@/lib/time-on-site";
import { PillPager } from "./pill-pager";
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
 * Overview → Right now: everyone with a page open, with running clocks. Between reads they advance with the wall clock
 * (only while their page is being read, and for at most the heartbeat window), and every read resets them to the
 * recorded figures. This is the only live table in Super Admin (user request 2026-11-28: live visitors in one place).
 */
export function LiveNowTable({ everyone, from, now, ownHosts }: Readonly<{ everyone: StreamVisitor[]; from: number; now: number; ownHosts: readonly string[] }>) {
  const live = useMemo(() => timeOnSite(everyone, from, Infinity, ownHosts).live, [everyone, from, ownHosts]);
  // Time since this read landed, ticking each second while anyone is on the site; a new read starts it again at zero.
  const [elapsed, setElapsed] = useState({ now, ms: 0 });
  const anyoneLive = live.length > 0;
  useEffect(() => {
    if (!anyoneLive) return;
    const landed = Date.now();
    const timer = setInterval(() => setElapsed({ now, ms: Date.now() - landed }), 1000);
    return () => clearInterval(timer);
  }, [now, anyoneLive]);
  // Never run past the heartbeat window: if reads stop, the clocks stop instead of inventing time.
  const extra = elapsed.now === now ? Math.min(LIVE_MS, Math.max(0, elapsed.ms)) : 0;
  return <section className={styles.panel}>
    <article className={styles.card} data-tone="live">
      <h3><Radio size={16} aria-hidden="true" />Who is on the site now<span>{live.length ? `${n(live.length)} ${live.length === 1 ? "visitor" : "visitors"} · clocks run live, IST ${clockIST(now + extra)}` : "nobody at the moment"}</span></h3>
      {live.length ? <div className={styles.tableWrap}><table>
        <thead><tr><th scope="col">Visitor</th><th scope="col">On site for</th><th scope="col">On screen</th><th scope="col">Reading now</th><th scope="col">Pages</th><th scope="col">Came from</th><th scope="col">Location</th><th scope="col">Device</th></tr></thead>
        <tbody>{live.map(v => <tr key={v.key}>
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
  </section>;
}

/**
 * How long visitors stay, for User activities (the reporting window). `everyone` is that page's own visitor list, so the
 * figures match every panel beside it. Who is on the site right now is on the Overview only (LiveNowTable).
 */
export function SuperAdminTimeOnSite({ everyone, from, ownHosts, windowLabel, exact, recordsFrom, recordsLabel }: Readonly<{ everyone: StreamVisitor[]; from: number; now: number; ownHosts: readonly string[]; windowLabel: string; exact: boolean; recordsFrom?: number; recordsLabel?: string }>) {
  const data = useMemo(() => exact ? timeOnSite(everyone, from, Infinity, ownHosts) : null, [exact, everyone, from, ownHosts]);
  if (!data) return <section className={styles.panel} aria-busy="true"><p className={styles.wait}>Timing visitors once the visitor stream has loaded…</p></section>;
  const maxBucket = Math.max(1, ...data.buckets.map(b => b.people));
  const timed = data.timing.recorded + data.timing.live + data.timing.partial;

  return <section className={styles.panel}>
    <TimeLeaderboard everyone={everyone} from={from} windowLabel={windowLabel} recordsFrom={recordsFrom} recordsLabel={recordsLabel} ownHosts={ownHosts} />

    <dl className={styles.kpis}>
      <Kpi icon={Timer} tone="sky" label="Avg. time on screen" value={stayText(data.avgOnScreenMs)} note={`per visitor · median ${stayText(data.medianOnScreenMs)}`} />
      <Kpi icon={Hourglass} tone="lavender" label="Avg. visit length" value={stayText(data.avgVisitMs)} note={`arrival to last activity · median ${stayText(data.medianVisitMs)}`} />
      <Kpi icon={Sigma} tone="mint" label="Total time on screen" value={stayText(data.totalOnScreenMs)} note={`${n(data.people)} visitors · ${n(data.visits)} visits`} />
      <Kpi icon={UserCheck} tone="peach" label="Engaged visitors" value={pct(data.engaged, data.people)} note={`${n(data.engaged)} stayed ${ENGAGED_MS / 1000} s or more on screen`} />
      <Kpi icon={BookOpenText} tone="butter" label="Deep readers" value={n(data.deep)} note={`${pct(data.deep, data.people)} read ${DEEP_MS / 60_000} min or more`} />
      <Kpi icon={Trophy} tone="rose" label="Longest visit" value={stayText(data.longestVisitMs)} note="most time in a single visit, arrival to last activity" />
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
          <th scope="row">{v.who}</th>
          <td>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(v.start))} {clockIST(v.start)}</td>
          <td className={styles.clock}>{stayClock(v.onScreenMs)}</td><td className={styles.clock}>{stayClock(v.stayMs)}</td><td>{n(v.views)}</td>
          <td className={styles.page}><code>{v.entry}</code><small>{v.open ? "visit in progress" : `left from ${v.exit ?? "—"}`}</small></td>
          <td>{v.source}</td><td><span className={styles.place}><CountryFlag code={v.country} size={16} />{placeOf(v.city, v.country)}</span></td>
        </tr>)}</tbody>
      </table></div> : <p className={styles.empty}>No visits in this window yet.</p>}
    </article>

    <p className={styles.note}><ShieldCheck size={14} aria-hidden="true" /><span><b>How the time is measured.</b> Time on screen is the time a page was visible (a hidden tab or a second window is not counted twice), from each page&apos;s leave beacon and the heartbeat of pages still open. Visit length runs from arrival to the last activity. Of {n(timed)} visits, <b>{n(data.timing.recorded)}</b> are fully recorded, <b>{n(data.timing.live)}</b> are still running and <b>{n(data.timing.partial)}</b> lost a beacon (only the recorded time is counted, nothing is guessed). Crawlers, automated browsers and visits under a second are left out.</span></p>
  </section>;
}

const LEADERS_PER_PAGE = 10;
const MEDAL = ["Gold", "Silver", "Bronze"];

/**
 * Every visitor ranked by the time they spent on the site, most first (lib/time-on-site.ts timeLeaders): the window the
 * section shows, or, when `recordsFrom` is given, every day the visitor stream still holds.
 */
function TimeLeaderboard({ everyone, from, windowLabel, recordsFrom, recordsLabel, ownHosts }: Readonly<{ everyone: StreamVisitor[]; from: number; windowLabel: string; recordsFrom?: number; recordsLabel?: string; ownHosts: readonly string[] }>) {
  const [range, setRange] = useState<"window" | "records">("window");
  const [page, setPage] = useState(0);
  const start = range === "records" && recordsFrom != null ? recordsFrom : from;
  const leaders = useMemo(() => timeLeaders(everyone, start, Infinity, ownHosts), [everyone, start, ownHosts]);
  const pages = Math.max(1, Math.ceil(leaders.length / LEADERS_PER_PAGE));
  const shown = Math.min(page, pages - 1);
  const rows = leaders.slice(shown * LEADERS_PER_PAGE, (shown + 1) * LEADERS_PER_PAGE);
  const total = leaders.reduce((sum, l) => sum + l.onScreenMs, 0);
  const label = range === "records" ? recordsLabel ?? "all records" : windowLabel;

  return <article className={styles.card} data-tone="rank">
    <div className={styles.cardHead}>
      <h3><Trophy size={16} aria-hidden="true" />Visitors ranked by time spent<span>{label} · most time on screen first · {n(leaders.length)} {leaders.length === 1 ? "visitor" : "visitors"}</span></h3>
      {recordsFrom != null && <div className={styles.toggle} role="group" aria-label="Ranking window">
        <button type="button" aria-pressed={range === "window"} onClick={() => { setRange("window"); setPage(0); }}>{windowLabel.replace(/ since.*/, "").replace(/^./, c => c.toUpperCase())}</button>
        <button type="button" aria-pressed={range === "records"} onClick={() => { setRange("records"); setPage(0); }}>{(recordsLabel ?? "All records").replace(/^./, c => c.toUpperCase())}</button>
      </div>}
    </div>
    {rows.length ? <><div className={styles.tableWrap}><table>
      <thead><tr><th scope="col">Rank</th><th scope="col">Visitor</th><th scope="col">Time spent</th><th scope="col">Share</th><th scope="col">Visit length</th><th scope="col">Visits</th><th scope="col">Pages</th><th scope="col">Most read page</th><th scope="col">Came from</th><th scope="col">Location</th><th scope="col">Last seen (IST)</th></tr></thead>
      <tbody>{rows.map(l => <tr key={l.key} data-rank={l.rank <= 3 ? l.rank : undefined}>
        <td className={styles.rankCell}>{l.rank <= 3 ? <span className={styles.medal} data-rank={l.rank} title={`${MEDAL[l.rank - 1]} · rank ${l.rank}`}>{l.rank}</span> : <span className={styles.rankNo}>{l.rank}</span>}</td>
        <th scope="row">{l.who}<small>{l.signedIn ? "Signed in" : GROUP_LABEL[l.group]} · {[l.device].filter(Boolean).join("")}</small></th>
        <td className={styles.clock}>{stayClock(l.onScreenMs)}<small className={styles.sub}>{stayText(l.onScreenMs)}</small></td>
        <td className={styles.shareCell}><span className={styles.shareBar} aria-hidden="true"><i style={{ width: `${total ? (l.onScreenMs / total) * 100 : 0}%` }} /></span>{pct(l.onScreenMs, total)}</td>
        <td className={styles.clock}>{stayClock(l.stayMs)}</td>
        <td>{n(l.visits)}</td><td>{n(l.views)}</td>
        <td className={styles.page}>{l.topPage ? <><code title={l.topPage}>{l.topPage}</code><small>{stayText(l.topPageMs)} on it</small></> : "—"}</td>
        <td>{l.source}</td>
        <td><span className={styles.place}><CountryFlag code={l.country} size={16} />{placeOf(l.city, l.country)}</span></td>
        <td>{`${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(l.lastAt))} ${clockIST(l.lastAt)}`}</td>
      </tr>)}</tbody>
    </table></div>
    {pages > 1 && <PillPager page={shown} pages={pages} total={leaders.length} perPage={LEADERS_PER_PAGE} onPage={setPage} label="Ranking" noun="visitors" />}</>
      : <p className={styles.empty}>No visitors in this window yet.</p>}
  </article>;
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
