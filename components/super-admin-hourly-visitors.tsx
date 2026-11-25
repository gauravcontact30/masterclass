"use client";
import { useMemo, useState } from "react";
import { Clock, Crown, Eye, Flame, UserPlus, Users } from "lucide-react";
import type { StreamVisitor } from "@/lib/live-visits";
import { hourlyVisitors, hourSpan, istClock, type HourWindow } from "@/lib/hourly-visitors";
import { countryName } from "./super-admin-audience";
import { CountryFlag } from "./country-flag";
import { PillPager } from "./pill-pager";
import styles from "./super-admin-hourly-visitors.module.css";

const ROWS_PER_PAGE = 8;
const WINDOWS: [HourWindow, string][] = [["24h", "Last 24 hours"], ["today", "Today"], ["yesterday", "Yesterday"]];
const n = (value: number) => value.toLocaleString("en-IN");
const dayName = (ms: number) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(ms));

/**
 * Overview → "Visitors by hour": who visited in each hour of the 24-hour IST clock, with the busiest hour (most
 * visitors) highlighted. `everyone` is the Overview's own list of visitors, so every figure here agrees with the panels
 * around it. `exact` is false while the stream has not loaded the whole range (or is capped).
 */
export function SuperAdminHourlyVisitors({ everyone, now, exact, ownHosts }: Readonly<{ everyone: StreamVisitor[]; now: number; exact: boolean; ownHosts: string[] }>) {
  const [range, setRange] = useState<HourWindow>("24h");
  const [page, setPage] = useState<number | null>(null);
  const data = useMemo(() => exact ? hourlyVisitors(everyone, range, now, ownHosts) : null, [exact, everyone, range, now, ownHosts]);

  if (!data) return <section className={styles.panel} aria-busy="true"><p className={styles.wait}>Counting visitors hour by hour once the visitor stream has loaded…</p></section>;
  const { slots, peakHours, peakPeople } = data;
  const top = Math.max(1, peakPeople);
  const peakSlots = slots.filter(s => peakHours.includes(s.hour));
  const pages = Math.ceil(slots.length / ROWS_PER_PAGE);
  // Opens on the page with the (first) busiest hour, until the reader picks a page.
  const firstPeak = slots.findIndex(s => peakHours.includes(s.hour));
  const shown = page ?? Math.max(0, Math.floor((firstPeak < 0 ? slots.findIndex(s => s.current) : firstPeak) / ROWS_PER_PAGE));
  const rows = slots.slice(shown * ROWS_PER_PAGE, (shown + 1) * ROWS_PER_PAGE);
  const spansDays = range === "24h" && new Date(slots[0].start + 19_800_000).getUTCDate() !== new Date(slots[23].start + 19_800_000).getUTCDate();

  return <section className={styles.panel} aria-labelledby="hourly-visitors-title">
    <div className={styles.head}>
      <h3 id="hourly-visitors-title"><Clock size={16} aria-hidden="true" />Visitors by hour<span>24-hour clock (HH:MM:SS), IST · {range === "24h" ? `${hourSpan(slots[0].hour).slice(0, 8)} ${dayName(slots[0].start)} to ${istClock(now)} today` : range === "today" ? `${dayName(slots[0].start)} · 00:00:00 to ${istClock(now)}` : `${dayName(slots[0].start)} · 00:00:00 to 24:00:00`}</span></h3>
      <div className={styles.toggle} role="group" aria-label="Window">
        {WINDOWS.map(([key, label]) => <button key={key} type="button" aria-pressed={range === key} onClick={() => { setRange(key); setPage(null); }}>{label}</button>)}
      </div>
    </div>

    <div className={styles.peak} data-empty={peakHours.length ? undefined : ""}>
      <span className={styles.peakIcon} aria-hidden="true"><Crown size={18} /></span>
      {peakHours.length ? <p>
        <small>Most visitors came in the hour span{peakHours.length > 1 ? `s · ${peakHours.length} hours tied` : ""}</small>
        <b>{peakSlots.map(s => `${hourSpan(s.hour)}${spansDays ? ` (${dayName(s.start)})` : ""}`).join(", ")}</b>
        <span>{n(peakPeople)} {peakPeople === 1 ? "visitor" : "visitors"}{peakSlots.length === 1 ? ` · ${n(peakSlots[0].newVisitors)} new · ${n(peakSlots[0].views)} page views` : " in each"}</span>
      </p> : <p><small>Most visitors</small><b>No visitors yet</b><span>The busiest hour appears with the first visitor in this range.</span></p>}
      <dl className={styles.totals}>
        <div><dt><Users size={12} aria-hidden="true" />Visitors</dt><dd>{n(data.people)}</dd></div>
        <div><dt><UserPlus size={12} aria-hidden="true" />New</dt><dd>{n(data.newVisitors)}</dd></div>
        <div><dt><Eye size={12} aria-hidden="true" />Page views</dt><dd>{n(data.views)}</dd></div>
        <div><dt><Clock size={12} aria-hidden="true" />Active hours</dt><dd>{data.activeHours} / 24</dd></div>
      </dl>
    </div>

    <div className={styles.chart} role="img" aria-label={`Visitors per hour, ${WINDOWS.find(w => w[0] === range)?.[1]}. ${peakHours.length ? `Most visitors ${peakSlots.map(s => hourSpan(s.hour)).join(", ")} with ${peakPeople}.` : "No visitors yet."}`}>
      {slots.map(s => <div key={s.start} className={styles.col} data-peak={peakHours.includes(s.hour) || undefined} data-now={s.current || undefined} data-future={s.future || undefined}
        title={s.future ? `${hourSpan(s.hour)} IST: not yet` : `${hourSpan(s.hour)} IST${spansDays ? `, ${dayName(s.start)}` : ""}: ${s.people} visitors, ${s.newVisitors} new, ${s.views} page views`}>
        <span className={styles.count}>{s.people || ""}</span>
        <span className={styles.bar} style={{ height: `${s.people ? Math.max(6, (s.people / top) * 100) : 0}%` }}>
          {s.newVisitors > 0 && <i style={{ height: `${(s.newVisitors / s.people) * 100}%` }} />}
        </span>
        <small>{String(s.hour).padStart(2, "0")}</small>
      </div>)}
    </div>
    <div className={styles.scale} aria-hidden="true">{[0, 6, 12, 18].map(i => <span key={i}>{hourSpan(slots[i].hour).slice(0, 8)}</span>)}<span>{hourSpan(slots[23].hour).slice(-8)}</span></div>
    <p className={styles.legend}><span><i data-key="all" />Visitors</span><span><i data-key="new" />of them new</span><span><i data-key="peak" />Most visitors</span><span><i data-key="now" />This hour</span></p>

    <div className={styles.tableWrap} id="hourly-visitors-rows">
      <table>
        <thead><tr><th scope="col">Hour span (IST, HH:MM:SS)</th><th scope="col">Visitors</th><th scope="col">New</th><th scope="col">Signed in</th><th scope="col">Page views</th><th scope="col">Top country</th></tr></thead>
        <tbody>{rows.map(s => <tr key={s.start} data-peak={peakHours.includes(s.hour) || undefined} data-now={s.current || undefined}>
          <th scope="row">{hourSpan(s.hour)}{spansDays && <small>{dayName(s.start)}</small>}{peakHours.includes(s.hour) && <em className={styles.badge}><Flame size={11} aria-hidden="true" />Peak</em>}{s.current && <em className={styles.nowBadge}>now · {istClock(now)}</em>}</th>
          {s.future ? <td colSpan={5} className={styles.future}>Not yet</td> : <>
            <td><b>{n(s.people)}</b></td><td>{n(s.newVisitors)}</td><td>{n(s.signedIn)}</td><td>{n(s.views)}</td>
            <td>{s.topCountry ? <span className={styles.country}><CountryFlag code={s.topCountry} size={16} />{countryName(s.topCountry) || s.topCountry}</span> : "—"}</td>
          </>}
        </tr>)}</tbody>
      </table>
    </div>
    <PillPager page={shown} pages={pages} total={slots.length} perPage={ROWS_PER_PAGE} onPage={setPage} label="Hours" noun="hours" controls="hourly-visitors-rows" />
    <p className={styles.note}>A visitor is counted in every hour they opened a page, so the hours can add up to more than the range&apos;s visitors. New: their first visit ever began in that hour. Crawlers, automated browsers and visits under a second are left out, as everywhere on this page.</p>
  </section>;
}
