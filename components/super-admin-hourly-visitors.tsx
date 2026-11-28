"use client";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Eye, Radio, Timer, UserPlus, Users } from "lucide-react";
import type { StreamVisitor } from "@/lib/live-visits";
import { HOUR_MS, hourlyVisitors, hourSpan, istClock, istDayStart, istHourStart, type HourSlot } from "@/lib/hourly-visitors";
import { stayText } from "@/lib/time-on-site";
import { countryName } from "./super-admin-audience";
import { CountryFlag } from "./country-flag";
import styles from "./super-admin-hourly-visitors.module.css";

const n = (value: number) => value.toLocaleString("en-IN");
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
const pct = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "—";
const dayName = (ms: number) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(ms));
const RANK = { 1: { title: "Busiest hour", medal: "Gold" }, 2: { title: "Second busiest", medal: "Silver" }, 3: { title: "Third busiest", medal: "Bronze" } } as Record<number, { title: string; medal: string }>;

/**
 * Overview → "Visitors by hour": one IST calendar day from 00:00:00 to 24:00:00, hour by hour, with the three hours that
 * brought the most visitors ranked gold, silver and bronze. `everyone` is the Overview's own list of visitors, so every
 * figure agrees with the panels around it. `days` is how many days the visitor stream holds (each can be opened).
 * Today's current hour runs live: the clock and the hour's progress tick every second between reads.
 */
export function SuperAdminHourlyVisitors({ everyone, now, exact, ownHosts, days = 5 }: Readonly<{ everyone: StreamVisitor[]; now: number; exact: boolean; ownHosts: string[]; days?: number }>) {
  const [daysAgo, setDaysAgo] = useState(0);
  const data = useMemo(() => exact ? hourlyVisitors(everyone, daysAgo, now, ownHosts) : null, [exact, everyone, daysAgo, now, ownHosts]);
  // Seconds since this read landed, so the clock runs between reads; each read starts it again from the server's time.
  const [elapsed, setElapsed] = useState({ now, ms: 0 });
  useEffect(() => {
    if (daysAgo !== 0) return;
    const landed = Date.now();
    const timer = setInterval(() => setElapsed({ now, ms: Date.now() - landed }), 1000);
    return () => clearInterval(timer);
  }, [now, daysAgo]);

  if (!data) return <section className={styles.panel} aria-busy="true"><p className={styles.wait}>Counting visitors hour by hour once the visitor stream has loaded…</p></section>;
  // Never more than a minute ahead of the last read: if reads stop, the clock stops instead of running on.
  const clockNow = now + (elapsed.now === now ? Math.min(60_000, Math.max(0, elapsed.ms)) : 0);
  const { slots, top } = data;
  const maxPeople = Math.max(1, ...slots.map(s => s.people));
  const today = daysAgo === 0;
  const intoHour = clockNow - istHourStart(clockNow);

  return <section className={styles.panel} aria-labelledby="hourly-visitors-title">
    <div className={styles.head}>
      <h3 id="hourly-visitors-title"><Clock size={16} aria-hidden="true" />Visitors by hour
        <span>{dayName(data.dayStart)} · 00:00:00 to 24:00:00 IST{today ? "" : " · complete day"}</span></h3>
      <div className={styles.days} role="group" aria-label="Day">
        {Array.from({ length: days }, (_, i) => <button key={i} type="button" aria-pressed={daysAgo === i} onClick={() => setDaysAgo(i)}>
          {i === 0 ? "Today" : i === 1 ? "Yesterday" : dayName(istDayStart(now) - i * 86_400_000)}
        </button>)}
      </div>
    </div>

    {today && <div className={styles.liveBar} role="status">
      <span className={styles.liveDot} aria-hidden="true" /><b>Live</b>
      <span className={styles.liveClock}>{istClock(clockNow)} IST</span>
      <span className={styles.liveSep} aria-hidden="true" />
      <span>This hour {hourSpan(new Date(istHourStart(clockNow) + 19_800_000).getUTCHours())}</span>
      <span className={styles.hourProgress} role="presentation"><i style={{ width: `${(intoHour / HOUR_MS) * 100}%` }} /></span>
      <span className={styles.liveLeft}>{mmss(HOUR_MS - intoHour)} left</span>
    </div>}

    <div className={styles.totals}>
      {!today && <><Total icon={Users} label="Visitors" value={n(data.people)} />
      <Total icon={UserPlus} label="New" value={n(data.newVisitors)} note={pct(data.newVisitors, data.people)} />
      <Total icon={Eye} label="Page views" value={n(data.views)} /></>}
      <Total icon={CalendarDays} label="Hours with visitors" value={`${data.activeHours} / ${today ? slots.filter(s => !s.future).length : 24}`} />
      {today && <Total icon={Radio} label="Busiest hour so far" value={top[0] ? hourSpan(top[0].hour) : "—"} note={top[0] ? `${n(top[0].people)} visitors` : undefined} />}
    </div>

    <div className={styles.podium} aria-label="Top three hours by visitors">
      {[1, 2, 3].map(rank => { const s = top[rank - 1]; return s ? <article key={rank} className={styles.place} data-rank={rank}>
        <header><span className={styles.medal} aria-hidden="true">{rank}</span><div><small>{RANK[rank].medal} · {RANK[rank].title}</small><b>{hourSpan(s.hour)}</b></div>{s.current && <em className={styles.nowTag}>live now</em>}</header>
        <p className={styles.placeFigure}><strong>{n(s.people)}</strong><span>{s.people === 1 ? "visitor" : "visitors"} · {pct(s.people, data.people)} of the day&apos;s visitors</span></p>
        <span className={styles.share} aria-hidden="true"><i style={{ width: `${data.people ? (s.people / data.people) * 100 : 0}%` }} /></span>
        <dl>
          <div><dt>New</dt><dd>{n(s.newVisitors)}</dd></div><div><dt>Returning</dt><dd>{n(s.returning)}</dd></div>
          <div><dt>Page views</dt><dd>{n(s.views)}</dd></div><div><dt>Reading</dt><dd>{stayText(s.readingMs)}</dd></div>
        </dl>
        <footer>{s.topCountry ? <span><CountryFlag code={s.topCountry} size={15} />{countryName(s.topCountry) || s.topCountry}</span> : <span>Country not resolved</span>}{s.topSource && <span>via {s.topSource}</span>}</footer>
      </article> : <article key={rank} className={styles.place} data-rank={rank} data-empty=""><header><span className={styles.medal} aria-hidden="true">{rank}</span><div><small>{RANK[rank].medal} · {RANK[rank].title}</small><b>—</b></div></header><p className={styles.placeEmpty}>{today ? "Fills in as visitors arrive today." : "No more hours had visitors this day."}</p></article>; })}
    </div>

    <div className={styles.chart} role="img" aria-label={`Visitors per hour on ${dayName(data.dayStart)}. ${top.map(s => `${RANK[s.rank!].medal}: ${hourSpan(s.hour)} with ${s.people}`).join("; ") || "No visitors yet."}`}>
      {slots.map(s => <div key={s.start} className={styles.col} data-rank={s.rank ?? undefined} data-now={s.current || undefined} data-future={s.future || undefined}
        title={s.future ? `${hourSpan(s.hour)} IST: upcoming` : `${hourSpan(s.hour)} IST: ${s.people} visitors, ${s.newVisitors} new, ${s.views} page views`}>
        <span className={styles.count}>{s.rank ? <span className={styles.chartMedal}>{s.rank}</span> : s.people || ""}</span>
        <span className={styles.bar} style={{ height: `${s.people ? Math.max(6, (s.people / maxPeople) * 100) : 0}%` }}>
          {s.newVisitors > 0 && <i style={{ height: `${(s.newVisitors / s.people) * 100}%` }} />}
        </span>
        <small>{String(s.hour).padStart(2, "0")}</small>
      </div>)}
    </div>
    <div className={styles.scale} aria-hidden="true"><span>00:00:00</span><span>06:00:00</span><span>12:00:00</span><span>18:00:00</span><span>24:00:00</span></div>
    <p className={styles.legend}><span><i data-key="all" />Visitors</span><span><i data-key="new" />Hatched: new visitors</span><span><i data-key="r1" />1st</span><span><i data-key="r2" />2nd</span><span><i data-key="r3" />3rd</span>{today && <span><i data-key="now" />This hour</span>}</p>

    <div className={styles.tableWrap}>
      <table>
        <caption className={styles.srOnly}>Visitors in each hour of {dayName(data.dayStart)}, 00:00:00 to 24:00:00 IST</caption>
        <thead><tr><th scope="col">Rank</th><th scope="col">Hour span (IST)</th><th scope="col">Visitors</th><th scope="col">New</th><th scope="col">Returning</th><th scope="col">Signed in</th><th scope="col">Page views</th><th scope="col">Reading</th><th scope="col">Top country</th><th scope="col">Top source</th></tr></thead>
        <tbody>{slots.map(s => <Row key={s.start} slot={s} max={maxPeople} clockNow={clockNow} />)}</tbody>
        <tfoot><tr><th scope="row" colSpan={2}>Whole day</th><td><b>{n(data.people)}</b><small>different people</small></td><td>{n(data.newVisitors)}</td><td colSpan={2} /><td>{n(data.views)}</td><td>{stayText(slots.reduce((sum, s) => sum + s.readingMs, 0))}</td><td colSpan={2} /></tr></tfoot>
      </table>
    </div>
    <p className={styles.note}>A visitor is counted in every hour they opened a page, so the hours add up to more than the day&apos;s different people. New: their first visit ever began in that hour. Returning: guests seen here before. Reading: time on screen of the pages opened in that hour. Ranks go to the hours with the most visitors (ties broken by page views, then the earlier hour). Crawlers, automated browsers and visits under a second are left out, as everywhere on this page.</p>
  </section>;
}

function Total({ icon: Icon, label, value, note }: Readonly<{ icon: typeof Users; label: string; value: string; note?: string }>) {
  return <div className={styles.total}><dt><Icon size={12} aria-hidden="true" />{label}</dt><dd>{value}{note && <small>{note}</small>}</dd></div>;
}

function Row({ slot: s, max, clockNow }: Readonly<{ slot: HourSlot; max: number; clockNow: number }>) {
  const into = clockNow - s.start;
  return <tr data-rank={s.rank ?? undefined} data-now={s.current || undefined} data-future={s.future || undefined} data-empty={!s.future && !s.people ? "" : undefined}>
    <td className={styles.rankCell}>{s.rank ? <span className={styles.medal} data-rank={s.rank} title={`${RANK[s.rank].medal}: ${RANK[s.rank].title}`}>{s.rank}</span> : <span className={styles.noRank}>·</span>}</td>
    <th scope="row">
      <span className={styles.span}>{hourSpan(s.hour)}</span>
      {s.current && <span className={styles.rowLive}><em><Timer size={11} aria-hidden="true" />Live · {istClock(clockNow)}</em><span className={styles.rowProgress}><i style={{ width: `${Math.min(100, (into / HOUR_MS) * 100)}%` }} /></span></span>}
    </th>
    {s.future ? <td colSpan={8} className={styles.upcoming}>Upcoming</td> : <>
      <td className={styles.visitorsCell}><span className={styles.inlineBar} aria-hidden="true"><i style={{ width: `${(s.people / max) * 100}%` }} /></span><b>{n(s.people)}</b></td>
      <td>{n(s.newVisitors)}</td><td>{n(s.returning)}</td><td>{n(s.signedIn)}</td><td>{n(s.views)}</td><td>{s.readingMs ? stayText(s.readingMs) : "—"}</td>
      <td>{s.topCountry ? <span className={styles.country}><CountryFlag code={s.topCountry} size={15} />{countryName(s.topCountry) || s.topCountry}</span> : "—"}</td>
      <td className={styles.source}>{s.topSource ?? "—"}</td>
    </>}
  </tr>;
}
